const db = require("../config/db.config");

// Get all lifedata by year
exports.getLifeDataByYear = async (req, res) => {
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
      SELECT [id], [gender], [life_age], [both_age], [year], [age]
      FROM [pyramid].[pyramid].[lifedata]
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

// Get life expectancy for a given age and gender
// gender: 'male', 'female', or 'both'
// Returns life_age for male/female, both_age for 'both' (using male row)
exports.getLifeExpectancy = async (req, res) => {
  try {
    let { age, gender, year } = req.query;

    if (age === undefined || age === null || age === '') {
      return res.status(400).json({
        error: { message: "Age parameter is required", status: 400 },
      });
    }

    const ageNum = Number(age);
    if (isNaN(ageNum) || ageNum < 0 || ageNum > 85) {
      return res.status(400).json({
        error: { message: "Age must be a number between 0 and 85", status: 400 },
      });
    }

    // Default to latest year if not provided
    if (!year) {
      const [yearRows] = await db.query(
        `SELECT MAX([year]) AS max_year FROM [pyramid].[pyramid].[lifedata]`
      );
      year = yearRows[0]?.max_year;
    }

    // Normalise gender
    const genderLower = (gender || '').toLowerCase();
    const isBoth = !genderLower || genderLower === 'both';

    // For 'both' mode: fetch male row and read both_age
    // For 'male'/'female' mode: fetch that gender row and read life_age
    const dbGender = isBoth ? 'male' : genderLower;

    const query = `
      SELECT [life_age], [both_age], [age], [gender], [year]
      FROM [pyramid].[pyramid].[lifedata]
      WHERE [year] = ? AND [gender] = ? AND [age] = ?
    `;

    const [rows] = await db.query(query, [year, dbGender, String(ageNum)]);

    if (!rows || rows.length === 0) {
      return res.status(404).json({
        error: {
          message: `No life expectancy data found for age ${ageNum}, gender '${dbGender}', year ${year}`,
          status: 404,
        },
      });
    }

    const row = rows[0];
    const lifeExpectancy = isBoth ? Number(row.both_age) : Number(row.life_age);
    const remainingYears = +(lifeExpectancy - ageNum).toFixed(1);

    // Build descriptive message (Georgian style)
    const genderLabel = isBoth ? 'ადამიანის' : genderLower === 'male' ? 'კაცის' : 'ქალის';
    const message = `${ageNum} წლის ${genderLabel} სიცოცხლის მოსალოდნელი ხანგრძლივობა საქართველოში ${lifeExpectancy} წელია`;

    res.json({
      year: Number(year),
      age: ageNum,
      gender: isBoth ? 'both' : genderLower,
      life_expectancy: lifeExpectancy,
      remaining_years: remainingYears > 0 ? remainingYears : 0,
      message,
    });
  } catch (err) {
    console.error("Life expectancy query error:", err);
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

// Get available years in lifedata
exports.getLifeDataYears = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT DISTINCT [year] FROM [pyramid].[pyramid].[lifedata] ORDER BY [year] DESC`
    );
    res.json({ years: rows.map(r => r.year) });
  } catch (err) {
    console.error("Life data years query error:", err);
    res.status(500).json({
      error: { message: "Internal Server Error", status: 500 },
    });
  }
};
