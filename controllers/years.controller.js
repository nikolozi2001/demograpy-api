const db = require("../config/db.config");

// Get all year details by year
exports.getYearsByYear = async (req, res) => {
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
            SELECT [Id], [year], [total], [male], [female], [median_total], 
            [median_male], [median_female], [leo_total], [leo_male],   
            [leo_female], [tfr], [natinc], [migration]
            FROM [pyramid].[pyramid].[years]
            WHERE [year] = ?
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

exports.getAgeGroupsByYear = async (req, res) => {
  let year;
  try {
    year = req.query.year;
    if (!year) {
      return res.status(400).json({
        error: { message: "Year parameter is required", status: 400 },
      });
    }

    const query = `
      SELECT
        CASE
          WHEN yd.age IN ('0','1-4','5-9','10-14') THEN '<15'
          WHEN yd.age IN ('15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64') THEN '15-64'
          ELSE '65+'
        END AS age_group,
        SUM(yd.total)  AS total,
        SUM(yd.male)   AS male,
        SUM(yd.female) AS female
      FROM [pyramid].[pyramid].[yeardetails] yd
      JOIN [pyramid].[pyramid].[years] y ON y.Id = yd.yearId
      WHERE y.[year] = ?
      GROUP BY
        CASE
          WHEN yd.age IN ('0','1-4','5-9','10-14') THEN '<15'
          WHEN yd.age IN ('15-19','20-24','25-29','30-34','35-39','40-44','45-49','50-54','55-59','60-64') THEN '15-64'
          ELSE '65+'
        END
    `;

    const [rows] = await db.query(query, [year]);

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

exports.getAgeGroupsByYearAndAges = async (req, res) => {
  try {
    const { year, age } = req.query;

    if (!year || !age) {
      return res.status(400).json({
        error: { message: "Year and Age parameters are required", status: 400 }
      });
    }

    // 1. ვიღებთ წლის მთლიან მოსახლეობას პროცენტის გამოსათვლელად
    const yearQuery = `SELECT [total] FROM [pyramid].[pyramid].[years] WHERE [year] = ?`;
    const [yearResults] = await db.query(yearQuery, [year]);
    
    if (!yearResults || yearResults.length === 0) {
      return res.status(404).json({ error: { message: "Year not found" } });
    }
    const grandTotal = yearResults[0].total;

    // 2. ვამუშავებთ ასაკობრივ ჯგუფებს
    const ageList = age.split(",");
    const placeholders = ageList.map(() => "?").join(",");

    // ვიყენებთ yd. პრეფიქსს, რომ თავიდან ავიცილოთ "Ambiguous column name"
    const query = `
      SELECT 
        yd.age, 
        yd.total, 
        yd.male, 
        yd.female
      FROM [pyramid].[pyramid].[yeardetails] yd
      JOIN [pyramid].[pyramid].[years] y ON y.Id = yd.yearId
      WHERE y.[year] = ? AND yd.age IN (${placeholders})
    `;

    const [rows] = await db.query(query, [year, ...ageList]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({ error: { message: "No data found for selected ages" } });
    }

    // 3. დაჯამება
    const summary = rows.reduce((acc, row) => {
      acc.total += Number(row.total);
      acc.male += Number(row.male);
      acc.female += Number(row.female);
      return acc;
    }, { total: 0, male: 0, female: 0 });

    // 4. გამოთვლები (ზუსტად ისე, როგორც თქვენს pyramid.js-შია)
    const million = +(summary.total / 1000000).toFixed(2);
    const percent = +((summary.total / grandTotal) * 100).toFixed(2);
    const sexRatio = summary.female ? +((summary.male / summary.female) * 100).toFixed(2) : 0;

    res.json({
      year: Number(year),
      year_total: grandTotal,
      label: age.includes(',') ? `${ageList[0]} - ${ageList[ageList.length-1]}` : age,
      million: million,
      percent: percent,
      sex_ratio: sexRatio,
      counts: {
        total: summary.total,
        male: summary.male,
        female: summary.female
      }
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: { message: err.message, status: 500 } });
  }
};
