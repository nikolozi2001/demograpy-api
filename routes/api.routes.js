
const express = require("express");
const router = express.Router();


const lifedataController = require("../controllers/lifedata.controller");

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

module.exports = router;
