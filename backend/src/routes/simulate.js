import express from "express";
import { runSimulation } from "../services/model.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { city, intervention, scale } = req.body;

  if (!city || !intervention || !scale) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const result = runSimulation({ city, intervention, scale });

  res.json(result);
});

export default router;
