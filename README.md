# Demography API

A Node.js Express API for Georgian demographic and population data, using SQL Server as the backend database.

## Features
- National and regional population statistics
- Age group breakdowns and demographic indicators
- Life expectancy data
- Marriage statistics
- Modular route and controller structure
- CORS enabled
- Environment variable support via `.env`
- Health check endpoint with database monitoring

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm
- SQL Server database

### Installation
1. Clone the repository:
   ```sh
   git clone https://github.com/nikolozi2001/demograpy-api.git
   cd demograpy-api
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file in the root directory with your database credentials:
   ```env
   DB_HOST=your_db_host
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_NAME=your_db_name
   PORT=5000
   ```
4. Start the development server:
   ```sh
   npm run dev
   ```

## Usage Examples

### Get National Age Groups for 2024
```sh
curl "http://localhost:5000/api/years/age-groups?year=2024"
```
Response:
```json
{
  "year": 2024,
  "totals": { "total": 3700000, "million": 3.7 },
  "groups": {
    "65+": { "total": 650000, "male": 280000, "female": 370000, ... },
    "15-64": { "total": 2500000, "male": 1200000, "female": 1300000, ... },
    "<15": { "total": 550000, "male": 285000, "female": 265000, ... }
  },
  "dependency_total": 48.0
}
```

### Get Dynamic Age Group Details (National)
The `age-details` endpoint dynamically groups ALL population data into three categories based on your selected ages:
```sh
# Ages 15-29 selected → groups: "< 15", "15 - 29", "30 +"
curl "http://localhost:5000/api/years/age-details?year=2025&age=15-19,20-24,25-29"

# Ages 5-24 selected → groups: "< 5", "5 - 24", "25 +"
curl "http://localhost:5000/api/years/age-details?year=2025&age=5-9,10-14,15-19,20-24"

# Ages 20-49 selected → groups: "< 20", "20 - 49", "50 +"
curl "http://localhost:5000/api/years/age-details?year=2025&age=20-24,25-29,30-34,35-39,40-44,45-49"
```
Response:
```json
{
  "year": 2025,
  "total_population": 3704506,
  "results": [
    {
      "age_group": "30 +",
      "million": 2.34,
      "percent": 63.26,
      "sex_ratio": 84.22,
      "total": 2344812,
      "male": 1069123,
      "female": 1275689
    },
    {
      "age_group": "15 - 29",
      "million": 0.65,
      "percent": 17.51,
      "sex_ratio": 109.99,
      "total": 648876,
      "male": 340123,
      "female": 308753
    },
    {
      "age_group": "< 15",
      "million": 0.71,
      "percent": 19.23,
      "sex_ratio": 107.74,
      "total": 710818,
      "male": 369329,
      "female": 341489
    }
  ]
}
```

### Get Dynamic Age Group Details (Regional)
```sh
curl "http://localhost:5000/api/regionyears/age-details?year=2025&region_code=GE-TB&age=15-19,20-24,25-29"
```
```

### Get Regional Data
```sh
curl "http://localhost:5000/api/regionyears?year=2024&region_code=GE-TB"
```

### Get Total Marriages
```sh
curl "http://localhost:5000/api/marriages/total?year=2024"
```
Response:
```json
{
  "year": 2024,
  "total": 21653
}
```


## API Endpoints

### Years (National)
- **GET** `/api/years/by-year?year=YYYY` — Get national summary data by year (total, male, female, median age, life expectancy, fertility rate, etc.)
- **GET** `/api/years/age-groups?year=YYYY` — Get national age group breakdown (<15, 15-64, 65+) with dependency ratios
- **GET** `/api/years/age-details?year=YYYY&age=AGES` — Dynamic age grouping: splits ALL population into 3 groups based on selected ages (below, selected, above). Example: `age=15-19,20-24,25-29` → groups "< 15", "15 - 29", "30 +"

### Year Details
- **GET** `/api/yeardetails/by-year?year=YYYY` — Get national per-age population data by year
- **GET** `/api/yeardetails/years` — Get list of all available years

### Region Years
- **GET** `/api/regionyears?year=YYYY&region_code=CODE` — Get regional summary data by year and region
- **GET** `/api/regionyears/age-groups?year=YYYY&region_code=CODE` — Get regional age group breakdown (<15, 15-64, 65+)
- **GET** `/api/regionyears/age-details?year=YYYY&region_code=CODE&age=AGES` — Dynamic regional age grouping (same as national but for a specific region)

### Region Details
- **GET** `/api/regiondetails?year=YYYY&region_code=CODE` — Get regional per-age population data by year and region

### Life Data
- **GET** `/api/lifedata/by-year?year=YYYY` — Get life expectancy data by year and gender

### Marriages
- **GET** `/api/marriages?year=YYYY` — Get marriage data by year (age groups and counts)
- **GET** `/api/marriages/total?year=YYYY` — Get total marriage count for a year
- **GET** `/api/marriages/years` — Get list of all available years with marriage data

### System
- **GET** `/health` — API health check with database status and system metrics

## Error Handling

The API returns consistent error responses:

```json
{
  "error": {
    "message": "Year parameter is required",
    "status": 400
  }
}
```

Common status codes:
- `400` - Missing or invalid parameters
- `404` - No data found for the specified filters
- `500` - Internal server error

## Common Region Codes

Examples of Georgian region codes:
- `GE-TB` - Tbilisi
- `GE-AJ` - Adjara
- `GE-KA` - Kakheti
- `GE-IM` - Imereti
- `GE-SJ` - Samtskhe-Javakheti

Use `/api/regionyears?year=YYYY&region_code=CODE` to query specific regions.


## Project Structure
```
index.js
package.json
web.config
config/
  db.config.js
controllers/
  lifedata.controller.js
  marriages.controller.js
  regiondetails.controller.js
  regionYears.controller.js
  yearDetails.controller.js
  years.controller.js
routes/
  api.routes.js
  index.js
```

## Database Schema

The API connects to a SQL Server database with the following main tables:
- `pyramid.pyramid.years` - National yearly statistics
- `pyramid.pyramid.yeardetails` - National per-age population data
- `pyramid.pyramid.regionyears` - Regional yearly statistics
- `pyramid.pyramid.regiondetails` - Regional per-age population data
- `pyramid.pyramid.lifedata` - Life expectancy data
- `pyramid.dbo.Marriages` - Marriage statistics by age groups

## Development

Run in development mode with auto-reload:
```sh
npm run dev
```

Run in production mode:
```sh
npm start
```

## Deployment

This API includes a `web.config` file for deployment on IIS/Azure App Service. Ensure your environment variables are properly configured in your hosting environment.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
MIT
