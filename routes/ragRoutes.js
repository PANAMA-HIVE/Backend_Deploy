import express from "express";
import { ragSummaryHandler, ragQuizHandler, ragHealthHandler } from "../controllers/ragControllers.js";

const router = express.Router();

router.get("/health", ragHealthHandler);
router.post("/summary", ragSummaryHandler);
router.post("/quiz", ragQuizHandler);

export default router;
