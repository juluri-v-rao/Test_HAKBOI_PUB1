using HAKOBIMASENKA.Repository;
using HAKOBIMASENKA.Repository.OrderEntryRepository;
using HAKOBIMASENKA.Repository.SearchRepository;
using HAKOBIMASENKA.Repository.ExpenseRepository;
using HAKOBIMASENKA.Repository.OriginDestRepository;
using HAKOBIMASENKA.Repository.ShipperRepository;
using HAKOBIMASENKA.Service;
using HAKOBIMASENKA.Service.OrderEntryService;
using HAKOBIMASENKA.Service.SearchService;
using HAKOBIMASENKA.Service.ExpenseService;
using HAKOBIMASENKA.Service.OriginDestinationService;
using HAKOBIMASENKA.Service.ShipperService;
using HAKOBIMASENKA.Repository.ProductCategoryMasterRepository;
using HAKOBIMASENKA.Repository.ManagementMasterRepository.ManagementMasterRepository;
using HAKOBIMASENKA.Service.ManagementMasterService.ManagementMasterService;
using HAKOBIMASENKA.Service.ProductCategoryService.ProductCategoryService;
using HAKOBIMASENKA.Repository.CharteredVehicleMasterRepository;
using HAKOBIMASENKA.Service.CharteredVehicleMasterService;
using HAKOBIMASENKA.Repository.MainMenuRepository;
using HAKOBIMASENKA.Repository.DriverMasterRepository;
using HAKOBIMASENKA.Service.DriverMasterService;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllersWithViews();

builder.Services.AddScoped<IDbConnectionFactory, SqlConnectionFactory>();

// Main menu header: version and company name (管理マスタ)
builder.Services.AddScoped<IMainMenuRepository, MainMenuRepository>();

builder.Services.AddScoped<IExpenseRepository, ExpenseRepository>();
builder.Services.AddScoped<IExpenseService, ExpenseService>();

builder.Services.AddScoped<IAreaMasterRepository, AreaMasterRepository>();
builder.Services.AddScoped<IAreaMasterService, AreaMasterService>();

builder.Services.AddScoped<IProductCategoryRepository, ProductCategoryRepository>();
builder.Services.AddScoped<IProductCategoryService, ProductCategoryService>();

builder.Services.AddScoped<IUnitMasterRepository,UnitMasterRepository>();
builder.Services.AddScoped<IUnitMasterService,UnitMasterService>();

builder.Services.AddScoped<IDepartmentMasterRepository,DepartmentMasterRepository>();
builder.Services.AddScoped<IDepartmentMasterService,DepartmentMasterService>();

builder.Services.AddScoped<IVehicleMasterRepository, VehicleMasterRepository>();
builder.Services.AddScoped<IVehicleMasterService, VehicleMasterService>();

builder.Services.AddScoped<IShipperRepository, ShipperRepository>();
builder.Services.AddScoped<IShipperService, ShipperService>();

builder.Services.AddScoped<IManagementMasterRepository, ManagementMasterRepository>();
builder.Services.AddScoped<IManagementMasterService, ManagementMasterService>();

builder.Services.AddScoped<IOrderEntryRepository, OrderEntryRepository>();
builder.Services.AddScoped<IOrderEntryLookupRepository, OrderEntryLookupRepository>();
builder.Services.AddScoped<IOrderEntryService, OrderEntryService>();

builder.Services.AddScoped<
    IVehicleSearchRepository,
    VehicleSearchRepository>();

builder.Services.AddScoped<
    IVehicleSearchService,
    VehicleSearchService>();

builder.Services.AddScoped<
    IDriverSearchRepository,
    DriverSearchRepository>();

builder.Services.AddScoped<
    IDriverSearchService,
    DriverSearchService>();

builder.Services.AddScoped<
    IShipperSearchRepository,
    ShipperSearchRepository>();

builder.Services.AddScoped<
    IShipperSearchService,
    ShipperSearchService>();

builder.Services.AddScoped<
    ICharteredSearchRepository,
    CharteredSearchRepository>();

builder.Services.AddScoped<
    ICharteredSearchService,
    CharteredSearchService>();

builder.Services.AddScoped<
    IProductNameSearchRepository,
    ProductNameSearchRepository>();

builder.Services.AddScoped<
    IProductNameSearchService,
    ProductNameSearchService>();

builder.Services.AddScoped<
    IAreaSearchRepository,
    AreaSearchRepository>();

builder.Services.AddScoped<
    IAreaSearchService,
    AreaSearchService>();

builder.Services.AddScoped<
    IProductClassificationSearchRepository,
    ProductClassificationSearchRepository>();

builder.Services.AddScoped<
    IProductClassificationSearchService,
    ProductClassificationSearchService>();

builder.Services.AddScoped<
    IUnitSearchRepository,
    UnitSearchRepository>();

builder.Services.AddScoped<
    IUnitSearchService,
    UnitSearchService>();

builder.Services.AddScoped<
    ITransportationRecordSearchRepository,
    TransportationRecordSearchRepository>();

builder.Services.AddScoped<
    ITransportationRecordSearchService,
    TransportationRecordSearchService>();

builder.Services.AddScoped<
    IDepartmentSearchRepository,
    DepartmentSearchRepository>();

builder.Services.AddScoped<
    IDepartmentSearchService,
    DepartmentSearchService>();

builder.Services.AddScoped<
    IExpenseSearchRepository,
    ExpenseSearchRepository>();

builder.Services.AddScoped<
    IExpenseSearchService,
    ExpenseSearchService>();

builder.Services.AddScoped<
    ICompanyBranchSearchRepository,
    CompanyBranchSearchRepository>();

builder.Services.AddScoped<
    ICompanyBranchSearchService,
    CompanyBranchSearchService>();

builder.Services.AddScoped<
    IOriginDestinationSearchRepository,
    OriginDestinationSearchRepository>();

builder.Services.AddScoped<
    IOriginDestinationSearchService,
    OriginDestinationSearchService>();

builder.Services.AddScoped<IOrderSearchRepository, OrderSearchRepository>();
builder.Services.AddScoped<IOrderSearchService, OrderSearchService>();

builder.Services.AddScoped<IProductMasterRepository, ProductMasterRepository>();
builder.Services.AddScoped<IProductMasterService, ProductMasterService>();

builder.Services.AddScoped<IOriginDestinationRepository, OriginDestinationRepository>();
builder.Services.AddScoped<IOriginDestinationService, OriginDestinationService>();

builder.Services.AddScoped<ICharteredVehicleMasterRepository, CharteredVehicleMasterRepository>();
builder.Services.AddScoped<ICharteredVehicleMasterService, CharteredVehicleMasterService>();

builder.Services.AddScoped<IDriverMasterRepository, DriverMasterRepository>();
builder.Services.AddScoped<IDriverMasterService, DriverMasterService>();

var app = builder.Build();

// Configure the HTTP request pipeline.
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Home/Error");
    // The default HSTS value is 30 days. You may want to change this for production scenarios, see https://aka.ms/aspnetcore-hsts.
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthorization();

app.MapControllerRoute(
    name: "default",
    pattern: "{controller=Home}/{action=Title}/{id?}");

app.Run();
