const express = require("express");
const router = express.Router();

const lifedataController = require("../controllers/lifedata.controller");
const regiondetailsController = require("../controllers/regiondetails.controller");
const regionYearsController = require("../controllers/regionYears.controller");
const yearDetailsController = require("../controllers/yearDetails.controller");
const yearsController = require("../controllers/years.controller");

// Define routes with error handling
const handleRoute = (controller, method) => {
  return (req, res) => {
    if (typeof controller[method] !== "function") {
      return res
        .status(500)
        .json({ error: `Handler ${method} is not implemented` });
    }
    return controller[method](req, res);
  };
};

// Lifedata endpoints
router.get(
  "/lifedata/by-year",
  handleRoute(lifedataController, "getLifeDataByYear"),
);

router.get(
  "/regiondetails",
  handleRoute(regiondetailsController, "getRegionDetailsByYear"),
);

router.get(
  "/regionyears",
  handleRoute(regionYearsController, "getRegionYearsByYear"),
);

router.get(
  "/yeardetails/by-year",
  handleRoute(yearDetailsController, "getYearDetailsByYear"),
);

router.get("/years/by-year", handleRoute(yearsController, "getYearsByYear"));

router.get("/years/age-groups", yearsController.getAgeGroupsByYear);

module.exports = router;
