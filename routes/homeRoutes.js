import express from 'express';
import { verifyAuth } from '../middleware/verifyAuth.js';
import { dashboardHandler, profileHandler } from '../controllers/homeControllers.js';

const router = express.Router();

// Clerk's middleware to protect routes

//routes for home
router.get("/dashboard", dashboardHandler);
router.get("/profile", profileHandler);


export default router;