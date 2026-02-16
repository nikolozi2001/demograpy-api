const sql = require("mssql");

// Create the connection pool configuration
const poolConfig = {
  server: process.env.DB_HOST,
  user: process.env.DB_USER ,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  pool: {
    min: 0,
    max: 10
  },
  options: {
    encrypt: false,
    trustServerCertificate: true,
    enableArithAbort: true
  }
};

console.log('Database configuration:', {
  server: poolConfig.server,
  user: poolConfig.user,
  database: poolConfig.database,
  // Don't log the password
});

let pool;

const initializePool = async () => {
  try {
    pool = new sql.ConnectionPool(poolConfig);
    await pool.connect();
    console.log('Database connected successfully');
    
    // Test the connection with a simple query
    const request = pool.request();
    await request.query('SELECT 1');
    console.log('Test query successful');
  } catch (err) {
    console.error("Initial database connection error:", err);
    if (err.code === 'ELOGIN') {
      console.error('Access denied - check username and password');
    }
    if (err.code === 'ESOCKET') {
      console.error('Database connection was refused.');
    }
  }
};

// Initialize the pool on startup
initializePool();

// Handle pool errors
const handlePoolError = (err) => {
  console.error('Database pool error:', err);
};

if (pool) {
  pool.on('error', handlePoolError);
}

// Convert MySQL parameter placeholders (?) to SQL Server placeholders (@p1, @p2, etc.)
const convertParams = (queryString, params) => {
  let paramIndex = 1;
  let convertedQuery = queryString;
  
  // Replace ? with @p1, @p2, etc.
  convertedQuery = convertedQuery.replace(/\?/g, () => `@p${paramIndex++}`);
  
  return { query: convertedQuery, params };
};

// Export query helper
module.exports = {
  sql,
  pool,
  query: async (queryString, params = []) => {
    try {
      if (!pool || !pool.connected) {
        throw new Error('Database pool is not connected');
      }

      const request = pool.request();
      
      // Handle parameterized queries
      if (params && params.length > 0) {
        const { query, params: convertedParams } = convertParams(queryString, params);
        convertedParams.forEach((value, index) => {
          request.input(`p${index + 1}`, value);
        });
        const result = await request.query(query);
        return [result.recordset, result];
      } else {
        const result = await request.query(queryString);
        return [result.recordset, result];
      }
    } catch (err) {
      throw err;
    }
  },
  request: () => {
    if (!pool || !pool.connected) {
      throw new Error('Database pool is not connected');
    }
    return pool.request();
  }
};
