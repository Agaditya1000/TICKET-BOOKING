import serverless from "serverless-http";
import app from "../src/app";
import connectDB from "../src/db"; // uses your existing src/db/index.ts

let connected = false;
async function ensureConnected() {
  if (!connected) {
    await connectDB();
    connected = true;
  }
}

const handler = serverless(app);

export default async function (req: any, res: any) {
  await ensureConnected();
  return handler(req, res);
}
