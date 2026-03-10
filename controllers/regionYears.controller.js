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

exports.getAgeGroupsByYear = async (req, res) => {
  let year, region_code;
  try {
    year = req.query.year;
    region_code = req.query.region_code;
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
      SELECT
        CASE
          WHEN rd.age IN ('0','1-4','5-9','10-14') THEN '<15'
          WHEN rd.age IN ('15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64') THEN '15-64'
          ELSE '65+'
        END AS age_group,
        SUM(rd.total)  AS total,
        SUM(rd.male)   AS male,
        SUM(rd.female) AS female
      FROM [pyramid].[pyramid].[regiondetails] rd
      WHERE rd.[year] = ? AND rd.[region_code] = ?
      GROUP BY
        CASE
          WHEN rd.age IN ('0','1-4','5-9','10-14') THEN '<15'
          WHEN rd.age IN ('15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64') THEN '15-64'
          ELSE '65+'
        END
    `;

    const [rows] = await db.query(query, [year, region_code]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: { message: `No data found for year ${year}`, status: 404 },
      });
    }

    const byGroup = Object.fromEntries(
      rows.map((r) => [
        r.age_group,
        {
          total: r.total,
          male: r.male,
          female: r.female,
        },
      ]),
    );

    const totalAll =
      (byGroup["<15"]?.total || 0) +
      (byGroup["15-64"]?.total || 0) +
      (byGroup["65+"]?.total || 0);

    const under15 = byGroup["<15"]?.total || 0;
    const working = byGroup["15-64"]?.total || 0;
    const over65 = byGroup["65+"]?.total || 0;

    const pct = (v) => (totalAll ? +((v / totalAll) * 100).toFixed(2) : 0);

    const dependency = (v) => (working ? +((v / working) * 100).toFixed(2) : 0);

    const sexRatio = (male, female) =>
      female ? +((male / female) * 100).toFixed(2) : 0;

    const inMillions = (v) => +(v / 1000000).toFixed(2);

    res.json({
      year: Number(year),
      region_code,
      totals: { total: totalAll, million: inMillions(totalAll) },
      groups: {
        "65+": {
          ...byGroup["65+"],
          percent: pct(over65),
          dependency: dependency(over65),
          sex_ratio: sexRatio(byGroup["65+"]?.male, byGroup["65+"]?.female),
          million: inMillions(over65),
        },
        "15-64": {
          ...byGroup["15-64"],
          percent: pct(working),
          dependency: 100.0,
          sex_ratio: sexRatio(byGroup["15-64"]?.male, byGroup["15-64"]?.female),
          million: inMillions(working),
        },
        "<15": {
          ...byGroup["<15"],
          percent: pct(under15),
          dependency: dependency(under15),
          sex_ratio: sexRatio(byGroup["<15"]?.male, byGroup["<15"]?.female),
          million: inMillions(under15),
        },
      },
      dependency_total: working
        ? +(((under15 + over65) / working) * 100).toFixed(2)
        : 0,
    });
  } catch (err) {
    console.error("Age groups query error:", err);
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
