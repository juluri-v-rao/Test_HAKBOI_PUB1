using Microsoft.AspNetCore.Mvc;

namespace HAKOBIMASENKA.Controllers.MasterController
    {
    public class RouteMasterController : Controller
        {
        public IActionResult Route_master()
            {
            return View("~/Views/Master/RouteMaster/Route_master.cshtml");
            }
        }
    }
