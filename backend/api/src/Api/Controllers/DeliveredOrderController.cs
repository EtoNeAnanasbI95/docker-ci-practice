using Api.DTOs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.ShopDb;
using Models.ShopDb;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DeliveredOrderController(AppDbContext context) : ControllerBase
    {
        // GET: api/DeliveredOrder
        [HttpGet]
        public async Task<ActionResult<IEnumerable<DeliveredOrder>>> GetDeliveredOrders()
        {
            return await context.DeliveredOrders.ToListAsync();
        }

        // GET: api/DeliveredOrder/5
        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveredOrder>> GetDeliveredOrder(long id)
        {
            var deliveredOrder = await context.DeliveredOrders.FindAsync(id);

            if (deliveredOrder == null)
            {
                return NotFound();
            }

            return deliveredOrder;
        }

        // PUT: api/DeliveredOrder/5
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPut("{id}")]
        public async Task<IActionResult> PutDeliveredOrder(long id, DeliveredOrderDto deliveredOrderDto)
        {
            if (id != deliveredOrderDto.OrderId)
            {
                return BadRequest();
            }

            var deliveredOrder = await context.DeliveredOrders.FindAsync(id);
            if (deliveredOrder == null)
            {
                return NotFound();
            }

            var courierName = deliveredOrderDto.CourierName?.Trim();
            if (string.IsNullOrEmpty(courierName))
            {
                return BadRequest("Имя курьера обязательно");
            }

            deliveredOrder.DeliveryDate = NormalizeDeliveryDate(deliveredOrderDto.DeliveryDate);
            deliveredOrder.CourierName = courierName;

            await context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/DeliveredOrder
        // To protect from overposting attacks, see https://go.microsoft.com/fwlink/?linkid=2123754
        [HttpPost]
        public async Task<ActionResult<DeliveredOrder>> PostDeliveredOrder(DeliveredOrderDto deliveredOrderDto)
        {
            var courierName = deliveredOrderDto.CourierName?.Trim();
            if (string.IsNullOrEmpty(courierName))
            {
                return BadRequest("Имя курьера обязательно");
            }

            var orderExists = await context.Orders.AnyAsync(o => o.Id == deliveredOrderDto.OrderId && !o.IsDeleted);
            if (!orderExists)
            {
                return NotFound("Заказ не найден");
            }

            if (DeliveredOrderExists(deliveredOrderDto.OrderId))
            {
                return Conflict("Информация о доставке уже существует");
            }

            var deliveredOrder = new DeliveredOrder
            {
                OrderId = deliveredOrderDto.OrderId,
                DeliveryDate = NormalizeDeliveryDate(deliveredOrderDto.DeliveryDate),
                CourierName = courierName
            };

            context.DeliveredOrders.Add(deliveredOrder);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetDeliveredOrder", new { id = deliveredOrder.OrderId }, deliveredOrder);
        }

        // DELETE: api/DeliveredOrder/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteDeliveredOrder(long id)
        {
            var deliveredOrder = await context.DeliveredOrders.FindAsync(id);
            if (deliveredOrder == null)
            {
                return NotFound();
            }

            context.DeliveredOrders.Remove(deliveredOrder);
            await context.SaveChangesAsync();

            return NoContent();
        }

        private bool DeliveredOrderExists(long id)
        {
            return context.DeliveredOrders.Any(e => e.OrderId == id);
        }

        private static DateTime NormalizeDeliveryDate(DateTime date)
        {
            return DateTime.SpecifyKind(date, DateTimeKind.Unspecified);
        }
    }
}
