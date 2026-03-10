const express = require("express");
const router = express.Router();

const lifedataController = require("../controllers/lifedata.controller");
const regiondetailsController = require("../controllers/regiondetails.controller");
const regionYearsController = require("../controllers/regionYears.controller");
const yearDetailsController = require("../controllers/yearDetails.controller");
const yearsController = require("../controllers/years.controller");
const marriagesController = require("../controllers/marriages.controller");

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
  "/regionyears/age-groups",
  handleRoute(regionYearsController, "getAgeGroupsByYear"),
);

router.get(
  "/yeardetails/by-year",
  handleRoute(yearDetailsController, "getYearDetailsByYear"),
);

router.get(
  "/yeardetails/years",
  handleRoute(yearDetailsController, "getYears"),
);

router.get("/years/by-year", handleRoute(yearsController, "getYearsByYear"));

router.get("/years/age-groups", yearsController.getAgeGroupsByYear);

router.get(
  "/marriages",
  handleRoute(marriagesController, "getMarriagesByYear"),
);

router.get(
  "/marriages/total",
  handleRoute(marriagesController, "getTotalByYear"),
);

router.get(
  "/marriages/years",
  handleRoute(marriagesController, "getYears"),
);

module.exports = router;
