using HAKOBIMASENKA.Helpers;
using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
{
    public class SupplierMasterController : Controller
    {
        public IActionResult Supplier_master()
        {
            string code = CommonHelper.ZeroPad("", 10);
            ViewBag.Code = code;
            return View("~/Views/Master/SupplierMaster/Supplier_master.cshtml");
        }
    }
}
