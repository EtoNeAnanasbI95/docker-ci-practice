using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.ShopDb;
using Models.ShopDb;
using Api.DTOs;

namespace Api.Controllers
{
    /// <summary>
    /// Контроллер для управления товарами
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Produces("application/json")]
    public class ProductController(AppDbContext context) : ControllerBase
    {
        /// <summary>
        /// Получить все товары
        /// </summary>
        /// <returns>Список всех товаров</returns>
        /// <response code="200">Успешно получен список товаров</response>
        [HttpGet]
        [ProducesResponseType(typeof(IEnumerable<ProductListItemDto>), 200)]
        public async Task<ActionResult<IEnumerable<ProductListItemDto>>> GetProducts()
        {
            var products = await context.Products
                .Where(p => !p.IsDeleted)
                .Include(p => p.Brand)
                .OrderByDescending(p => p.CreatedAt)
                .AsNoTracking()
                .ToListAsync();

            return products.Select(MapToDto).ToList();
        }

        /// <summary>
        /// Получить каталог товаров (агрегированное представление)
        /// </summary>
        [HttpGet("catalog")]
        [ProducesResponseType(typeof(IEnumerable<ProductInventoryView>), 200)]
        public async Task<ActionResult<IEnumerable<ProductInventoryView>>> GetProductCatalog()
        {
            var catalog = await context.ProductInventoryView.AsNoTracking().ToListAsync();
            return catalog;
        }

        /// <summary>
        /// Получить товар по ID
        /// </summary>
        /// <param name="id">ID товара</param>
        /// <returns>Товар с указанным ID</returns>
        /// <response code="200">Товар найден</response>
        /// <response code="404">Товар не найден</response>
        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ProductListItemDto), 200)]
        [ProducesResponseType(404)]
        public async Task<ActionResult<ProductListItemDto>> GetProduct(long id)
        {
            var product = await context.Products
                .Where(p => p.Id == id && !p.IsDeleted)
                .Include(p => p.Brand)
                .AsNoTracking()
                .FirstOrDefaultAsync();

            if (product == null)
            {
                return NotFound();
            }

            return MapToDto(product);
        }

        /// <summary>
        /// Обновить товар
        /// </summary>
        /// <param name="id">ID товара</param>
        /// <param name="productDto">Данные товара для обновления</param>
        /// <returns>Результат операции</returns>
        [HttpPut("{id}")]
        public async Task<ActionResult> PutProduct(long id, ProductUpdateDto productDto)
        {
            if (id != productDto.Id)
            {
                return BadRequest("ID в URL не совпадает с ID в теле запроса");
            }

            var existingProduct = await context.Products.FindAsync(id);
            if (existingProduct == null)
            {
                return NotFound();
            }

            existingProduct.IsDeleted = true;
            existingProduct.UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);

            var newProduct = new Product
            {
                Name = productDto.Name,
                Description = productDto.Description,
                BrandId = productDto.BrandId,
                Price = productDto.Price,
                StockQuantity = productDto.StockQuantity,
                ImageUrl = productDto.ImageUrl,
                IsDeleted = false,
                CreatedAt = existingProduct.CreatedAt,
                UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified)
            };

            context.Products.Add(newProduct);

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!ProductExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        /// <summary>
        /// Создать новый товар
        /// </summary>
        /// <param name="productDto">Данные нового товара</param>
        /// <returns>Созданный товар</returns>
        [HttpPost]
        public async Task<ActionResult<Product>> PostProduct(ProductCreateDto productDto)
        {
            var product = new Product
            {
                Name = productDto.Name,
                Description = productDto.Description,
                BrandId = productDto.BrandId,
                Price = productDto.Price,
                StockQuantity = productDto.StockQuantity,
                ImageUrl = productDto.ImageUrl,
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified)
            };

            context.Products.Add(product);
            await context.SaveChangesAsync();

            await context.Entry(product).Reference(p => p.Brand).LoadAsync();

            return CreatedAtAction("GetProduct", new { id = product.Id }, MapToDto(product));
        }

        /// <summary>
        /// Удалить товар (soft delete)
        /// </summary>
        /// <param name="id">ID товара для удаления</param>
        /// <returns>Результат операции</returns>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProduct(long id)
        {
            var product = await context.Products.FindAsync(id);
            if (product == null)
            {
                return NotFound();
            }

            // Soft delete - помечаем как удаленный
            product.IsDeleted = true;
            product.UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);

            await context.SaveChangesAsync();

            return NoContent();
        }

        private bool ProductExists(long id)
        {
            return context.Products.Any(e => e.Id == id);
        }

        private static ProductListItemDto MapToDto(Product product)
        {
            return new ProductListItemDto
            {
                Id = product.Id,
                Name = product.Name,
                Description = product.Description,
                BrandId = product.BrandId,
                Price = product.Price,
                StockQuantity = product.StockQuantity,
                ImageUrl = product.ImageUrl,
                IsDeleted = product.IsDeleted,
                CreatedAt = product.CreatedAt,
                UpdatedAt = product.UpdatedAt,
                Brand = new ProductBrandDto
                {
                    Id = product.Brand?.Id ?? product.BrandId,
                    Name = product.Brand?.Name ?? "Неизвестный бренд",
                    IsDeleted = product.Brand?.IsDeleted ?? false,
                    CreatedAt = product.Brand?.CreatedAt ?? product.CreatedAt
                }
            };
        }
    }
}
