import serverless from "serverless-http";
import app from "../src/app";
import connectDB from "../src/db";

let connected = false;
let connectionError: Error | null = null;
let connectionAttempted = false;

async function ensureConnected() {
  // Don't block health endpoint
  if (connectionError && connectionAttempted) {
    console.warn('Database connection previously failed, but continuing...');
    return;
  }
  
  if (!connected && !connectionAttempted) {
    connectionAttempted = true;
    try {
      await connectDB();
      connected = true;
      console.log('✅ Database connection established');
    } catch (error: any) {
      connectionError = error;
      console.error('❌ Database connection failed:', error.message);
      // Don't throw - allow function to continue for health checks
    }
  }
}

const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

export default async function (req: any, res: any) {
  // Health endpoint doesn't need database
  if (req.url === '/health' || req.path === '/health') {
    try {
      return await handler(req, res);
    } catch (error: any) {
      console.error('Health check error:', error.message);
      return res.status(200).json({ ok: true });
    }
  }
  
  // For other endpoints, try to connect (but don't fail if it doesn't work)
  try {
    await ensureConnected();
    return await handler(req, res);
  } catch (error: any) {
    console.error('Function error:', error.message);
    console.error('Stack:', error.stack);
    
    if (!res.headersSent) {
      return res.status(500).json({
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'production' 
          ? 'An error occurred' 
          : error.message,
      });
    }
    return res;
  }
}
