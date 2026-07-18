import express from 'express';
import { getRoadmap } from '../controllers/roadmapController.js';

const router = express.Router();

// Debug middleware to trace incoming requests to this specific router
router.use((req, res, next) => {
  console.log(`[ROUTE TRIGGERED] Inside roadmapRoutes.js -> Method: ${req.method} | URL: ${req.originalUrl}`);
  next();
});

// Maps to POST http://localhost:5000/api/roadmap
router.post('/', getRoadmap);

console.log('✅ Roadmap Router fully loaded and paths exported.');
export default router;