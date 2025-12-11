// src/index.ts
import app from './app';
import { pool } from './db';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 4000;

// Test database connection before starting server
async function startServer() {
  try {
    // Test database connection
    const client = await pool.connect();
    await client.query('SELECT NOW()');
    client.release();
    console.log('✅ Database connection successful');
    
    // Start server
    app.listen(PORT, () => {
      console.log(`✅ Server listening on port ${PORT}`);
      console.log(`📚 API Documentation: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health Check: http://localhost:${PORT}/health`);
    });
  } catch (error: any) {
    console.error('❌ Database connection failed:', error.message);
    console.error('\nPlease check:');
    console.error('1. PostgreSQL is running');
    console.error('2. DATABASE_URL in .env is correct');
    console.error('3. Database "ticketdb" exists');
    console.error('4. Password is URL-encoded if it contains special characters');
    process.exit(1);
  }
}

startServer();
