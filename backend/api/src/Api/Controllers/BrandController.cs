using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.ShopDb;
using Models.ShopDb;
using Api.DTOs;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class BrandController(AppDbContext context) : ControllerBase
    {
        // GET: api/Brand
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Brand>>> GetBrands()
        {
            return await context.Brands.Where(b => !b.IsDeleted).ToListAsync();
        }

        // GET: api/Brand/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Brand>> GetBrand(long id)
        {
            var brand = await context.Brands.FirstOrDefaultAsync(b => b.Id == id && !b.IsDeleted);

            if (brand == null)
            {
                return NotFound();
            }

            return brand;
        }

        // PUT: api/Brand/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutBrand(long id, BrandDto brandDto)
        {
            if (id != brandDto.Id)
            {
                return BadRequest();
            }

            var existingBrand = await context.Brands.FindAsync(id);
            if (existingBrand == null)
            {
                return NotFound();
            }

            // Update only the fields that should be updated
            existingBrand.Name = brandDto.Name;

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!BrandExists(id))
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

        // POST: api/Brand
        [HttpPost]
        public async Task<ActionResult<Brand>> PostBrand(BrandCreateDto brandDto)
        {
            var brand = new Brand
            {
                Name = brandDto.Name,
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified)
            };

            context.Brands.Add(brand);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetBrand", new { id = brand.Id }, brand);
        }

        // DELETE: api/Brand/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteBrand(long id)
        {
            var brand = await context.Brands.FindAsync(id);
            if (brand == null)
            {
                return NotFound();
            }

            // Soft delete - помечаем как удаленный
            brand.IsDeleted = true;
            await context.SaveChangesAsync();

            return NoContent();
        }

        private bool BrandExists(long id)
        {
            return context.Brands.Any(e => e.Id == id);
        }
    }
}
