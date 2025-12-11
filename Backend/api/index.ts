// Simple serverless handler for Vercel (optional - only needed for deployment)
import serverless from "serverless-http";
import app from "../src/app";

const handler = serverless(app);

export default handler;
