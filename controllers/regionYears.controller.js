const db = require("../config/db.config");

// Get all regionyears by year
exports.getRegionYearsByYear = async (req, res) => {
  try {
    const { year, region_code } = req.query;
    if (!year || !region_code) {
      return res.status(400).json({
        error: {
          message:
            !year && !region_code
              ? "Year and region_code parameters are required"
              : !year
                ? "Year parameter is required"
                : "region_code parameter is required",
          status: 400,
        },
      });
    }

    const query = `
            SELECT [Id], [year], [region_code], [region], [total], [male], [female], [median_total], [median_male], [median_female]
            FROM [pyramid].[pyramid].[regionyears]
            WHERE [year] = ? AND [region_code] = ?
        `;

    console.log(
      "Executing query:",
      query,
      "with year:",
      year,
      "and region_code:",
      region_code,
    );
    const [results] = await db.query(query, [year, region_code]);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: {
          message: `No data found for year ${year} and region_code ${region_code}`,
          status: 404,
          filters: { year, region_code },
        },
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Query error details:", {
      message: err.message,
      code: err.code,
      filters: { year: req.query.year, region_code: req.query.region_code },
    });

    res.status(500).json({
      error: {
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal Server Error",
        code: err.code,
        status: 500,
      },
    });
  }
};
