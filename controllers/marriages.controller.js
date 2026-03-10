const db = require("../config/db.config");

// Get marriages by year
exports.getMarriagesByYear = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({
        error: {
          message: "Year parameter is required",
          status: 400,
        },
      });
    }

    const query = `
      SELECT [Id], [Year], [MaleAgeGroup], [FemaleAgeGroup], [MarriageCount]
      FROM [pyramid].[dbo].[Marriages]
      WHERE [Year] = ?
    `;

    console.log("Executing query:", query, "with year:", year);
    const [results] = await db.query(query, [year]);

    if (!results || results.length === 0) {
      return res.status(404).json({
        error: {
          message: `No data found for year ${year}`,
          status: 404,
          filters: { year },
        },
      });
    }

    res.json(results);
  } catch (err) {
    console.error("Query error details:", {
      message: err.message,
      code: err.code,
      filters: { year: req.query.year },
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

// Get total marriage count by year
exports.getTotalByYear = async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) {
      return res.status(400).json({
        error: {
          message: "Year parameter is required",
          status: 400,
        },
      });
    }

    const query = `
      SELECT SUM([MarriageCount]) AS total
      FROM [pyramid].[dbo].[Marriages]
      WHERE [Year] = ?
    `;

    const [results] = await db.query(query, [year]);

    if (!results || results.length === 0 || results[0].total === null) {
      return res.status(404).json({
        error: {
          message: `No data found for year ${year}`,
          status: 404,
          filters: { year },
        },
      });
    }

    res.json({
      year: Number(year),
      total: results[0].total,
    });
  } catch (err) {
    console.error("Query error details:", {
      message: err.message,
      code: err.code,
      filters: { year: req.query.year },
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

// Get all available years for marriages
exports.getYears = async (req, res) => {
  try {
    const query = `SELECT DISTINCT [Year] FROM [pyramid].[dbo].[Marriages] ORDER BY [Year] ASC`;

    const [results] = await db.query(query);

    if (!results || results.length === 0) {
      return res.json([]);
    }

    const years = results.map((row) => row.Year);
    res.json(years);
  } catch (err) {
    console.error("Query error details:", {
      message: err.message,
      code: err.code,
    });
    res.status(500).json({
      error: {
        message:
          process.env.NODE_ENV === "development"
            ? err.message
            : "Internal Server Error",
        status: 500,
      },
    });
  }
};
