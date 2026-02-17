CONNECTION_STRING="Host=93.183.69.250;Port=5432;Database=coursework_db;Username=admin;Password=Dimasik_lychshii000;"
PROVIDER=Npgsql.EntityFrameworkCore.PostgreSQL
CONTEXT=AppDbContext
OUTPUT_DIR=ShopDb
MODELS_OUTPUT_DIR=./src/Models/$(OUTPUT_DIR)
CONTEXT_OUTPUT_DIR=./src/Data/$(OUTPUT_DIR)


scaffold-models:
	dotnet ef dbcontext scaffold $(CONNECTION_STRING) $(PROVIDER) \
		--project ./src/Models \
		--startup-project ./src/Api \
		--output-dir $(OUTPUT_DIR) \
		--context TempContext \
		--force

scaffold-context:
	dotnet ef dbcontext scaffold $(CONNECTION_STRING) $(PROVIDER) \
		--project ./src/Data \
		--startup-project ./src/Api \
		--output-dir $(OUTPUT_DIR) \
		--context $(CONTEXT) \
		--force \
		--no-onconfiguring

clean-temp-context:
	rm -f $(MODELS_OUTPUT_DIR)/TempContext.cs

clean-temp-models:
	find $(CONTEXT_OUTPUT_DIR) -name "*.cs" ! -name "$(CONTEXT).cs" -delete 2>/dev/null || true

scaffold: scaffold-models clean-temp-context scaffold-context clean-temp-models

# Использование: make controller ENTITY=Brand
controller:
	@if [ -z "$(ENTITY)" ]; then echo "Error: ENTITY parameter is required. Usage: make controller ENTITY=Brand"; exit 1; fi
	dotnet-aspnet-codegenerator controller \
		--project ./src/Api \
		-name $(ENTITY)Controller \
		-m Models.ShopDb.$(ENTITY) \
		-dc Data.ShopDb.$(CONTEXT) \
		-api \
		-outDir Controllers \
		--force \
		-dbProvider postgres

# Генерация CRUD контроллеров для всех моделей
controllers-all:
	@echo "Generating CRUD controllers for all models..."
	$(MAKE) controller ENTITY=Brand
	$(MAKE) controller ENTITY=DeliveredOrder
	$(MAKE) controller ENTITY=Material
	$(MAKE) controller ENTITY=Order
	$(MAKE) controller ENTITY=OrderDetail
	$(MAKE) controller ENTITY=OrderStatus
	$(MAKE) controller ENTITY=PaymentStatus
	$(MAKE) controller ENTITY=Product
	$(MAKE) controller ENTITY=Role
	$(MAKE) controller ENTITY=User
	@echo "All CRUD controllers generated successfully!"

run:
	dotnet run --project src/Api/Api.csproj
