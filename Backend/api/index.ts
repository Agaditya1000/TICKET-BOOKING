import app from '../src/app';

export default function handler(req: any, res: any) {
  // Delegate request handling to the Express app instance
  return (app as any)(req, res);
}
