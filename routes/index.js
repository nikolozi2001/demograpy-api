const express = require("express");
const router = express.Router();
const apiRoutes = require("./api.routes");
const db = require("../config/db.config");
const os = require("os");

// Track server start time for uptime calculation
const serverStartTime = Date.now();

router.use("/api", apiRoutes);

// Health check endpoint
router.get("/health", async (req, res) => {
  let dbStatus = { connected: false, latency: null };
  
  try {
    const start = Date.now();
    await db.query("SELECT 1");
    dbStatus = { connected: true, latency: Date.now() - start };
  } catch (err) {
    dbStatus = { connected: false, error: err.message };
  }

  const uptime = Date.now() - serverStartTime;
  
  res.json({
    status: dbStatus.connected ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: {
      ms: uptime,
      formatted: formatUptime(uptime)
    },
    database: dbStatus,
    system: {
      nodeVersion: process.version,
      platform: process.platform,
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(os.totalmem() / 1024 / 1024)
      }
    }
  });
});

function formatUptime(ms) {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return days + "d " + (hours % 24) + "h " + (minutes % 60) + "m";
  if (hours > 0) return hours + "h " + (minutes % 60) + "m " + (seconds % 60) + "s";
  if (minutes > 0) return minutes + "m " + (seconds % 60) + "s";
  return seconds + "s";
}

router.get("/", async (req, res) => {
  // Check database status
  let dbConnected = false;
  try {
    await db.query("SELECT 1");
    dbConnected = true;
  } catch (err) {
    dbConnected = false;
  }

  const uptime = formatUptime(Date.now() - serverStartTime);
  const nodeVersion = process.version;
  const env = process.env.NODE_ENV || "development";
  const dbStatusClass = dbConnected ? "status-online" : "status-offline";
  const dbStatusText = dbConnected ? "Connected" : "Disconnected";
  const currentYear = new Date().getFullYear();

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Demography API - Documentation</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          min-height: 100vh;
          color: #fff;
          line-height: 1.6;
        }
        .header {
          background: rgba(255,255,255,0.05);
          backdrop-filter: blur(10px);
          padding: 20px 40px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          border-bottom: 1px solid rgba(255,255,255,0.1);
          position: sticky;
          top: 0;
          z-index: 100;
        }
        .header-left { display: flex; align-items: center; gap: 16px; }
        .logo { font-size: 32px; }
        .header h1 { font-size: 24px; font-weight: 600; }
        .version {
          background: linear-gradient(135deg, #667eea, #764ba2);
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        .container { max-width: 1200px; margin: 0 auto; padding: 40px 20px; }
        
        /* Status Cards */
        .status-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 40px;
        }
        .status-card {
          background: rgba(255,255,255,0.05);
          border-radius: 16px;
          padding: 24px;
          border: 1px solid rgba(255,255,255,0.1);
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .status-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 10px 40px rgba(0,0,0,0.3);
        }
        .status-card .label { color: #888; font-size: 14px; margin-bottom: 8px; }
        .status-card .value { font-size: 24px; font-weight: 600; }
        .status-card .icon { font-size: 28px; margin-bottom: 12px; }
        .status-online { color: #4caf50; }
        .status-offline { color: #f44336; }
        
        /* Sections */
        .section { margin-bottom: 40px; }
        .section-title {
          font-size: 20px;
          font-weight: 600;
          margin-bottom: 20px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .section-title::after {
          content: '';
          flex: 1;
          height: 1px;
          background: rgba(255,255,255,0.1);
        }
        
        /* Endpoint Categories */
        .category {
          background: rgba(255,255,255,0.03);
          border-radius: 16px;
          margin-bottom: 20px;
          overflow: hidden;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .category-header {
          background: rgba(255,255,255,0.05);
          padding: 16px 24px;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          user-select: none;
        }
        .category-header:hover { background: rgba(255,255,255,0.08); }
        .category-icon { font-size: 20px; }
        .category-count {
          margin-left: auto;
          background: rgba(255,255,255,0.1);
          padding: 2px 10px;
          border-radius: 10px;
          font-size: 12px;
        }
        .endpoints { padding: 8px; }
        
        /* Endpoint Item */
        .endpoint {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 16px;
          border-radius: 8px;
          transition: background 0.2s;
        }
        .endpoint:hover { background: rgba(255,255,255,0.05); }
        .method {
          font-size: 11px;
          font-weight: 700;
          padding: 4px 8px;
          border-radius: 4px;
          min-width: 50px;
          text-align: center;
        }
        .method-get { background: #4caf50; color: #fff; }
        .method-post { background: #2196f3; color: #fff; }
        .method-put { background: #ff9800; color: #fff; }
        .method-delete { background: #f44336; color: #fff; }
        .endpoint-path {
          font-family: 'Monaco', 'Consolas', monospace;
          color: #e0e0e0;
          font-size: 14px;
        }
        .endpoint-path .param { color: #ff9800; }
        .endpoint-desc {
          color: #888;
          font-size: 13px;
          margin-left: auto;
        }
        
        /* Footer */
        footer {
          text-align: center;
          padding: 40px;
          color: #666;
          border-top: 1px solid rgba(255,255,255,0.1);
        }
        footer a { color: #667eea; text-decoration: none; }
        footer a:hover { text-decoration: underline; }
        
        /* Responsive */
        @media (max-width: 768px) {
          .header { padding: 16px 20px; flex-wrap: wrap; gap: 12px; }
          .endpoint { flex-wrap: wrap; }
          .endpoint-desc { margin-left: 66px; margin-top: 4px; width: 100%; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <span class="logo">�</span>
          <h1>Demography API</h1>
        </div>
        <span class="version">v1.0.0</span>
      </div>
      
      <div class="container">
        <!-- Status Dashboard -->
        <div class="status-grid">
          <div class="status-card">
            <div class="icon">⚡</div>
            <div class="label">API Status</div>
            <div class="value status-online">Online</div>
          </div>
          <div class="status-card">
            <div class="icon">🗄️</div>
            <div class="label">Database</div>
            <div class="value ${dbStatusClass}">${dbStatusText}</div>
          </div>
          <div class="status-card">
            <div class="icon">⏱️</div>
            <div class="label">Uptime</div>
            <div class="value">${uptime}</div>
          </div>
          <div class="status-card">
            <div class="icon">🔧</div>
            <div class="label">Environment</div>
            <div class="value">${env}</div>
          </div>
          <div class="status-card">
            <div class="icon">📦</div>
            <div class="label">Node.js</div>
            <div class="value">${nodeVersion}</div>
          </div>
        </div>

        <!-- API Documentation -->
        <div class="section">
          <h2 class="section-title">📚 API Endpoints</h2>
          
          <!-- Years (National) -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">📅</span>
              <span>Years (National)</span>
              <span class="category-count">2 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/years/by-year?<span class="param">year</span></span>
                <span class="endpoint-desc">Get national summary data by year</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/years/age-groups?<span class="param">year</span></span>
                <span class="endpoint-desc">Get national age group breakdown (&#60;15, 15-64, 65+)</span>
              </div>
            </div>
          </div>

          <!-- Year Details -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">📊</span>
              <span>Year Details</span>
              <span class="category-count">2 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/yeardetails/by-year?<span class="param">year</span></span>
                <span class="endpoint-desc">Get national per-age population data by year</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/yeardetails/years</span>
                <span class="endpoint-desc">Get list of all available years</span>
              </div>
            </div>
          </div>

          <!-- Region Years -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">🏛️</span>
              <span>Region Years</span>
              <span class="category-count">2 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/regionyears?<span class="param">year</span>&amp;<span class="param">region_code</span></span>
                <span class="endpoint-desc">Get regional summary data by year and region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/regionyears/age-groups?<span class="param">year</span>&amp;<span class="param">region_code</span></span>
                <span class="endpoint-desc">Get regional age group breakdown (&#60;15, 15-64, 65+)</span>
              </div>
            </div>
          </div>

          <!-- Region Details -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">🗺️</span>
              <span>Region Details</span>
              <span class="category-count">1 endpoint</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/regiondetails?<span class="param">year</span>&amp;<span class="param">region_code</span></span>
                <span class="endpoint-desc">Get regional per-age population data by year and region</span>
              </div>
            </div>
          </div>

          <!-- Life Data -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">❤️</span>
              <span>Life Data</span>
              <span class="category-count">1 endpoint</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/lifedata/by-year?<span class="param">year</span></span>
                <span class="endpoint-desc">Get life expectancy data by year</span>
              </div>
            </div>
          </div>

          <!-- Marriages -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">💍</span>
              <span>Marriages</span>
              <span class="category-count">3 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/marriages?<span class="param">year</span></span>
                <span class="endpoint-desc">Get marriage data by year (age groups & counts)</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/marriages/total?<span class="param">year</span></span>
                <span class="endpoint-desc">Get total marriage count for a year</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/marriages/years</span>
                <span class="endpoint-desc">Get list of all available years</span>
              </div>
            </div>
          </div>

          <!-- System Endpoints -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">⚙️</span>
              <span>System</span>
              <span class="category-count">1 endpoint</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/health</span>
                <span class="endpoint-desc">API health check with DB status & metrics</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <footer>
        <p>© ${currentYear} Demography API · Built with ❤️ using Express.js</p>
        <p style="margin-top: 8px;">
          <a href="https://github.com/nikolozi2001/demograpy-api" target="_blank">GitHub Repository</a>
        </p>
      </footer>
    </body>
    </html>
  `);
});

// TODO: Remove this route after testing
router.get("/test-env", (req, res) => {
  res.json({
    dbHost: process.env.DB_HOST,
    nodeEnv: process.env.NODE_ENV,
    // Don't expose sensitive information in production
    envVarsSet: {
      DB_HOST: !!process.env.DB_HOST,
      DB_USER: !!process.env.DB_USER,
      DB_PASSWORD: !!process.env.DB_PASSWORD,
      DB_NAME: !!process.env.DB_NAME,
      ALLOWED_ORIGINS: !!process.env.ALLOWED_ORIGINS,
      NODE_ENV: !!process.env.NODE_ENV
    }
  });
});

module.exports = router;
