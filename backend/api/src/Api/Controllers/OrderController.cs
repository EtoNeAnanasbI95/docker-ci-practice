using Api.DTOs;
using Data.ShopDb;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Models.ShopDb;
using System.Text.Json;

namespace Api.Controllers;

[Route("api/[controller]")]
[ApiController]
public class OrderController(AppDbContext context) : ControllerBase
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OrderSummaryDto>>> GetOrders()
    {
        var orders = await context.Orders
            .Where(o => !o.IsDeleted)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new OrderSummaryDto
            {
                Id = o.Id,
                UserId = o.UserId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                OrderStatusId = o.OrderStatusId,
                OrderStatus = o.OrderStatus.Name,
                PaymentStatusId = o.PaymentStatusId,
                PaymentStatus = o.PaymentStatus.Name,
                CustomerLogin = o.User.Login,
                CustomerTelegram = o.User.TelegramUsername,
                CustomerName = o.User.FullName,
                DeliveredOrder = o.DeliveredOrder == null
                    ? null
                    : new DeliveredOrderSummaryDto
                    {
                        OrderId = o.DeliveredOrder.OrderId,
                        DeliveryDate = o.DeliveredOrder.DeliveryDate,
                        CourierName = o.DeliveredOrder.CourierName
                    }
            })
            .ToListAsync();

        return orders;
    }

    [HttpGet("{id:long}")]
    public async Task<ActionResult<OrderDetailsDto>> GetOrder(long id)
    {
        var order = await context.Orders
            .Where(o => o.Id == id && !o.IsDeleted)
            .Select(o => new OrderDetailsDto
            {
                Id = o.Id,
                UserId = o.UserId,
                OrderDate = o.OrderDate,
                TotalAmount = o.TotalAmount,
                OrderStatusId = o.OrderStatusId,
                OrderStatus = o.OrderStatus.Name,
                PaymentStatusId = o.PaymentStatusId,
                PaymentStatus = o.PaymentStatus.Name,
                CustomerLogin = o.User.Login,
                CustomerTelegram = o.User.TelegramUsername,
                CustomerName = o.User.FullName,
                DeliveredOrder = o.DeliveredOrder == null
                    ? null
                    : new DeliveredOrderSummaryDto
                    {
                        OrderId = o.DeliveredOrder.OrderId,
                        DeliveryDate = o.DeliveredOrder.DeliveryDate,
                        CourierName = o.DeliveredOrder.CourierName
                    }
            })
            .FirstOrDefaultAsync();

        if (order == null)
        {
            return NotFound();
        }

        order.Items = await context.OrderDetails
            .Where(od => od.OrderId == id)
            .Select(od => new OrderItemDto
            {
                ProductId = od.ProductId,
                ProductName = od.Product.Name,
                Quantity = od.Quantity,
                PriceAtMoment = od.PriceAtMoment
            })
            .ToListAsync();

        return order;
    }

    [HttpPut("{id:long}")]
    public async Task<IActionResult> PutOrder(long id, OrderStatusUpdateDto dto)
    {
        if (id != dto.Id)
        {
            return BadRequest();
        }

        var exists = await context.Orders.AnyAsync(o => o.Id == id && !o.IsDeleted);
        if (!exists)
        {
            return NotFound();
        }

        if (dto.DeliveryDate.HasValue && string.IsNullOrWhiteSpace(dto.CourierName))
        {
            return BadRequest("Укажите курьера для доставки");
        }

        var courier = string.IsNullOrWhiteSpace(dto.CourierName)
            ? null
            : dto.CourierName.Trim();

        var deliveryDateParam = dto.DeliveryDate ?? (object)DBNull.Value;
        var courierParam = (object?)courier ?? DBNull.Value;

        await context.Database.ExecuteSqlRawAsync(
            "CALL update_order_status_with_delivery({0}, {1}, {2}, {3}, {4})",
            id,
            dto.OrderStatusId,
            dto.PaymentStatusId,
            deliveryDateParam,
            courierParam);

        return NoContent();
    }

    [HttpPost]
    public async Task<ActionResult<Order>> PostOrder(Order order)
    {
        context.Orders.Add(order);
        await context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetOrder), new { id = order.Id }, order);
    }

    [HttpDelete("{id:long}")]
    public async Task<IActionResult> DeleteOrder(long id)
    {
        var order = await context.Orders.FindAsync(id);
        if (order == null)
        {
            return NotFound();
        }

        context.Orders.Remove(order);
        await context.SaveChangesAsync();

        return NoContent();
    }

    [HttpOptions("checkout")]
    public IActionResult CheckoutOptions()
    {
        Response.Headers.Append("Allow", "OPTIONS, POST");
        return Ok();
    }

    [HttpPost("checkout")]
    public async Task<ActionResult<CheckoutResultDto>> Checkout(CreateOrderRequestDto request)
    {
        if (request.Items.Count == 0)
        {
            return BadRequest("Список товаров пуст");
        }

        if (request.Items.Any(i => i.Quantity <= 0))
        {
            return BadRequest("Количество каждого товара должно быть больше нуля");
        }

        var userExists = await context.Users.AnyAsync(u => u.Id == request.UserId && !u.IsDeleted);
        if (!userExists)
        {
            return NotFound("Пользователь не найден");
        }

        var collapsedItems = request.Items
            .GroupBy(i => i.ProductId)
            .Select(g => new CheckoutItemDto
            {
                ProductId = g.Key,
                Quantity = g.Sum(i => i.Quantity)
            })
            .ToList();

        var productIds = collapsedItems.Select(i => i.ProductId).ToList();
        var stocks = await context.Products
            .Where(p => productIds.Contains(p.Id) && !p.IsDeleted)
            .Select(p => new { p.Id, p.StockQuantity })
            .ToListAsync();

        if (stocks.Count != productIds.Count)
        {
            return NotFound("Некоторые товары не найдены или недоступны");
        }

        var insufficient = collapsedItems
            .Select(item =>
            {
                var stock = stocks.First(s => s.Id == item.ProductId);
                return new
                {
                    item.ProductId,
                    item.Quantity,
                    stock.StockQuantity,
                    HasEnough = item.Quantity <= stock.StockQuantity
                };
            })
            .Where(x => !x.HasEnough)
            .ToList();

        if (insufficient.Any())
        {
            return BadRequest(new
            {
                message = "Недостаточно товара на складе",
                details = insufficient.Select(x => new
                {
                    x.ProductId,
                    requested = x.Quantity,
                    available = x.StockQuantity
                })
            });
        }

        var paymentStatusId = request.PaymentStatusId ?? await context.PaymentStatuses
            .OrderBy(ps => ps.Id)
            .Select(ps => ps.Id)
            .FirstOrDefaultAsync();

        var orderStatusId = request.OrderStatusId ?? await context.OrderStatuses
            .OrderBy(os => os.Id)
            .Select(os => os.Id)
            .FirstOrDefaultAsync();

        if (paymentStatusId == 0 || orderStatusId == 0)
        {
            return BadRequest("Не заданы статусы заказа или оплаты");
        }

        await context.Database.ExecuteSqlRawAsync("SELECT set_current_user_id({0})", request.UserId);

        var itemsPayload = JsonSerializer.Serialize(collapsedItems.Select(i => new
        {
            product_id = i.ProductId,
            quantity = i.Quantity
        }));

        await context.Database.ExecuteSqlRawAsync(
            "CALL create_order_with_details({0}, {1}, {2}, {3}::jsonb)",
            request.UserId,
            paymentStatusId,
            orderStatusId,
            itemsPayload);

        var createdOrder = await context.Orders
            .Where(o => o.UserId == request.UserId && !o.IsDeleted)
            .OrderByDescending(o => o.Id)
            .Select(o => new CheckoutResultDto
            {
                OrderId = o.Id,
                TotalAmount = o.TotalAmount
            })
            .FirstAsync();

        return Ok(createdOrder);
    }

    private bool OrderExists(long id)
    {
        return context.Orders.Any(e => e.Id == id);
    }
}
