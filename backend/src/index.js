import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import simulateRouter from "./routes/simulate.js";
import predictRouter from "./routes/predict.js";

const app = express();
const PORT = 8000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PUBLIC_DIR = path.resolve(__dirname, "../public");

app.use(cors());
app.use(express.json());
app.use(express.static(PUBLIC_DIR));

app.use("/simulate", simulateRouter);
app.use("/predict", predictRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
