# Demograpy API

This is a Node.js Express API for demographic data, using SQL Server as the backend database.


## Features
- Fetch lifedata, regiondetails, regionyears, yeardetails, and years by year
- Modular route and controller structure
- CORS enabled
- Environment variable support via `.env`

## Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm
- SQL Server database

### Installation
1. Clone the repository:
   ```sh
   git clone <your-repo-url>
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


## API Endpoints

- **GET** `/api/lifedata/by-year?year=YYYY` — Returns lifedata for the specified year.
- **GET** `/api/regiondetails/by-year?year=YYYY&region_code=CODE` — Returns regiondetails for the specified year and region_code.
- **GET** `/api/regionyears/by-year?year=YYYY&region_code=CODE` — Returns regionyears for the specified year and region_code.
- **GET** `/api/yeardetails/by-year?year=YYYY` — Returns yeardetails for the specified year.
- **GET** `/api/years/by-year?year=YYYY` — Returns years for the specified year.


## Project Structure
```
index.js
package.json
config/
  db.config.js
controllers/
  lifedata.controller.js
  regiondetails.controller.js
  regionYears.controller.js
  yearDetails.controller.js
  years.controller.js
routes/
  api.routes.js
  index.js
```

## License
MIT
