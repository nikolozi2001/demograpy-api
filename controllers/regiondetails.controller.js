const db = require("../config/db.config");

// Get all regiondetails by year
exports.getRegionDetailsByYear = async (req, res) => {
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
			SELECT [ID], [yearId], [year], [region_code], [age], [total], [male], [female]
			FROM [pyramid].[pyramid].[regiondetails]
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
