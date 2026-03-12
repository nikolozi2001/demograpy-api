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
    let { year, age } = req.query;

    if (!year || !age) {
      return res.status(400).json({
        error: { message: "Year and Age parameters are required", status: 400 }
      });
    }

    // URL-ში + ნიშანი ხშირად გარდაიქმნება ჰარად, ამიტომ ვასწორებთ
    age = age.replace(/ /g, '+');

    // 1. ერთიანი რუკა ყველა შესაძლო ჯგუფისთვის
    const ageGroupsMap = {
      // პირველი ვარიანტი
      "35+": ['35-39','40-44','45-49','50-54','55-59','60-64','65-69','70-74','75-79','80-84','85+'],
      "15-34": ['15-19','20-24','25-29','30-34'],
      "<15": ['0','1-4','5-9','10-14'],

      // მეორე ვარიანტი
      "50+": ['50-54','55-59','60-64','65-69','70-74','75-79','80-84','85+'],
      "20-49": ['20-24','25-29','30-34','35-39','40-44','45-49'],
      "<20": ['0','1-4','5-9','10-14','15-19']
    };

    // 2. ვიღებთ წლის მთლიან მოსახლეობას
    const [yearResults] = await db.query(
      `SELECT [Id], [total] FROM [pyramid].[pyramid].[years] WHERE [year] = ?`, 
      [year]
    );

    if (!yearResults || yearResults.length === 0) {
      return res.status(404).json({ error: { message: "Year not found" } });
    }
    const grandTotal = yearResults[0].total;
    const yearId = yearResults[0].Id;

    // 3. ვიღებთ წლის ყველა დეტალს
    const [allDetails] = await db.query(
      `SELECT age, total, male, female FROM [pyramid].[pyramid].[yeardetails] WHERE yearId = ?`,
      [yearId]
    );

    // 4. ვამუშავებთ მოთხოვნილ ჯგუფებს
    const requestedGroups = age.split(','); 
    
    const results = requestedGroups.map(groupKey => {
      // ვასუფთავებთ groupKey-ს ზედმეტი ჰარებისგან
      const cleanKey = groupKey.trim();
      const targetAges = ageGroupsMap[cleanKey] || [cleanKey];
      
      const filteredRows = allDetails.filter(d => targetAges.includes(String(d.age)));

      const sum = filteredRows.reduce((acc, row) => {
        acc.t += Number(row.total);
        acc.m += Number(row.male);
        acc.f += Number(row.female);
        return acc;
      }, { t: 0, m: 0, f: 0 });

      return {
        age_group: cleanKey,
        million: +(sum.t / 1000000).toFixed(2),
        percent: grandTotal ? +((sum.t / grandTotal) * 100).toFixed(2) : 0,
        sex_ratio: sum.f ? +((sum.m / sum.f) * 100).toFixed(2) : 0,
        total: sum.t,
        male: sum.m,
        female: sum.f
      };
    });

    res.json({
      year: Number(year),
      total_population: grandTotal,
      results: results
    });

  } catch (err) {
    console.error("Error:", err.message);
    res.status(500).json({ error: { message: "Internal Server Error" } });
  }
};