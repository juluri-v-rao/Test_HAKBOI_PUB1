using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterBasic
{
    public class OriginDestinationFreightRateMasterController : Controller
    {
        public IActionResult OriginDestinationFreightRate_master()
        {
            return View("~/Views/Master/OriginDestinationFreightRateMaster/OriginDestinationFreightRate_master.cshtml");
        }
    }
}
