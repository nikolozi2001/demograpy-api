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
      <title>GeoMap API - Documentation</title>
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
          <span class="logo">🗺️</span>
          <h1>GeoMap API</h1>
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
          
          <!-- Regional Data -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">🏛️</span>
              <span>Regional Statistics</span>
              <span class="category-count">26 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegBrunva</span>
                <span class="endpoint-desc">Get all regional business turnover data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegBrunva/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get business turnover by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getPayGender</span>
                <span class="endpoint-desc">Get all regional pay gender data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegPayGender/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get pay gender data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getValAdded</span>
                <span class="endpoint-desc">Get all regional value added data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegValAdded/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get value added by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployees</span>
                <span class="endpoint-desc">Get all regional employees data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployees/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get employees data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployeesGender</span>
                <span class="endpoint-desc">Get regional employees by gender</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployeesGender/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get employees by gender for region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployed</span>
                <span class="endpoint-desc">Get all regional employed data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegEmployed/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get employed data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegResale</span>
                <span class="endpoint-desc">Get all regional resale data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegResale/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get resale data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegInvestment</span>
                <span class="endpoint-desc">Get all regional investment data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegInvestment/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get investment data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegProdVal</span>
                <span class="endpoint-desc">Get all regional production value</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegProdVal/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get production value by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegPurchases</span>
                <span class="endpoint-desc">Get all regional purchases data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegPurchases/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get purchases data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegRemuneration</span>
                <span class="endpoint-desc">Get all regional remuneration data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegRemuneration/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get remuneration data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegCosts</span>
                <span class="endpoint-desc">Get all regional costs data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegCosts/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get costs data by region</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegIntConsumption</span>
                <span class="endpoint-desc">Get regional intermediate consumption</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getRegIntConsumption/<span class="param">:region_id</span></span>
                <span class="endpoint-desc">Get intermediate consumption by region</span>
              </div>
            </div>
          </div>

          <!-- Municipal Data -->
          <div class="category">
            <div class="category-header">
              <span class="category-icon">🏘️</span>
              <span>Municipal Statistics</span>
              <span class="category-count">12 endpoints</span>
            </div>
            <div class="endpoints">
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunBrunva</span>
                <span class="endpoint-desc">Get all municipal business turnover</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunValAdded</span>
                <span class="endpoint-desc">Get all municipal value added data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunPayGender</span>
                <span class="endpoint-desc">Get municipal pay gender data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunEmployees</span>
                <span class="endpoint-desc">Get all municipal employees data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunEmployed</span>
                <span class="endpoint-desc">Get all municipal employed data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunResale</span>
                <span class="endpoint-desc">Get all municipal resale data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunInvestment</span>
                <span class="endpoint-desc">Get all municipal investment data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunProdVal</span>
                <span class="endpoint-desc">Get all municipal production value</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunPurchases</span>
                <span class="endpoint-desc">Get all municipal purchases data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunRemuneration</span>
                <span class="endpoint-desc">Get all municipal remuneration data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunCosts</span>
                <span class="endpoint-desc">Get all municipal costs data</span>
              </div>
              <div class="endpoint">
                <span class="method method-get">GET</span>
                <span class="endpoint-path">/api/getMunIntConsumption</span>
                <span class="endpoint-desc">Get municipal intermediate consumption</span>
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
        <p>© ${currentYear} GeoMap API · Built with ❤️ using Express.js</p>
        <p style="margin-top: 8px;">
          <a href="https://github.com/nikolozi2001/geomap-api" target="_blank">GitHub Repository</a>
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
