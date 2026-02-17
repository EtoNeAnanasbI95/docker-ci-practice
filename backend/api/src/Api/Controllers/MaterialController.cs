using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Data.ShopDb;
using Models.ShopDb;
using Api.DTOs;

namespace Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class MaterialController(AppDbContext context) : ControllerBase
    {
        // GET: api/Material
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Material>>> GetMaterials()
        {
            return await context.Materials.Where(m => !m.IsDeleted).ToListAsync();
        }

        // GET: api/Material/5
        [HttpGet("{id}")]
        public async Task<ActionResult<Material>> GetMaterial(long id)
        {
            var material = await context.Materials.FirstOrDefaultAsync(m => m.Id == id && !m.IsDeleted);

            if (material == null)
            {
                return NotFound();
            }

            return material;
        }

        // PUT: api/Material/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutMaterial(long id, MaterialDto materialDto)
        {
            if (id != materialDto.Id)
            {
                return BadRequest();
            }

            var existingMaterial = await context.Materials.FindAsync(id);
            if (existingMaterial == null)
            {
                return NotFound();
            }

            // Update only the fields that should be updated
            existingMaterial.Name = materialDto.Name;
            existingMaterial.UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);

            try
            {
                await context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!MaterialExists(id))
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

        // POST: api/Material
        [HttpPost]
        public async Task<ActionResult<Material>> PostMaterial(MaterialCreateDto materialDto)
        {
            var material = new Material
            {
                Name = materialDto.Name,
                IsDeleted = false,
                CreatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified),
                UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified)
            };

            context.Materials.Add(material);
            await context.SaveChangesAsync();

            return CreatedAtAction("GetMaterial", new { id = material.Id }, material);
        }

        // DELETE: api/Material/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteMaterial(long id)
        {
            var material = await context.Materials.FindAsync(id);
            if (material == null)
            {
                return NotFound();
            }

            // Soft delete - помечаем как удаленный
            material.IsDeleted = true;
            material.UpdatedAt = DateTime.SpecifyKind(DateTime.Now, DateTimeKind.Unspecified);
            await context.SaveChangesAsync();

            return NoContent();
        }

        private bool MaterialExists(long id)
        {
            return context.Materials.Any(e => e.Id == id);
        }
    }
}
