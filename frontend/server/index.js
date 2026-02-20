import express from "express";
import { registerRoutes } from "./routes.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Initialize routes on startup
let initialized = false;

async function initApp() {
  if (!initialized) {
    try {
      await registerRoutes(app);
      
      // Error handler
      app.use((err, req, res, next) => {
        console.error('Server error:', err);
        const status = err.status || err.statusCode || 500;
        const message = err.message || "Internal Server Error";
        res.status(status).json({ error: message });
      });
      
      initialized = true;
      console.log('Routes initialized successfully');
    } catch (error) {
      console.error('Failed to initialize routes:', error);
      throw error;
    }
  }
  return app;
}

// Initialize immediately
initApp().catch(console.error);

// Vercel serverless function handler
export default async function handler(req, res) {
  try {
    const app = await initApp();
    return app(req, res);
  } catch (error) {
    console.error('Handler error:', error);
    res.status(500).json({ error: error.message });
  }
}
