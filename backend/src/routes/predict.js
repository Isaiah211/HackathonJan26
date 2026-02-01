import express from "express";
import { fetchBusinessImpactPrediction } from "../services/mlService.js";
import { parseBusinessQuery } from "../utils/queryParser.js";
import { LOCATION_PROFILES } from "../utils/locationProfiles.js";
import { generateAiExplanation } from "../services/aiExplainer.js";

const router = express.Router();

router.get("/locations", (req, res) => {
  res.json(LOCATION_PROFILES);
});

router.post("/", async (req, res) => {
  try {
    const { query = "", businessType, scale, location } = req.body || {};
    const parsed = parseBusinessQuery({ query, businessType, scale, location });

    const prediction = await fetchBusinessImpactPrediction(parsed);
    const summary = generateAiExplanation({ prediction, input: parsed, query });

    res.json({
      input: parsed,
      prediction,
      summary,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const statusCode = error.status || 400;
    res.status(statusCode).json({ error: error.message || "Unable to process request" });
  }
});

export default router;
