import serverless from "serverless-http";
import app from "../src/app";
import connectDB from "../src/db";

let connected = false;
let connectionError: Error | null = null;

async function ensureConnected() {
  if (connectionError) {
    throw connectionError;
  }
  if (!connected) {
    try {
      await connectDB();
      connected = true;
    } catch (error: any) {
      connectionError = error;
      console.error('Failed to connect to database:', error.message);
      throw error;
    }
  }
}

const handler = serverless(app, {
  binary: ['image/*', 'application/pdf']
});

export default async function (req: any, res: any) {
  try {
    await ensureConnected();
    return await handler(req, res);
  } catch (error: any) {
    console.error('Function error:', error.message);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: error.message || 'An error occurred',
      });
    }
    return res;
  }
}
