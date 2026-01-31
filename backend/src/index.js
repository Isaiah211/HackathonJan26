import express from "express";
import cors from "cors";
import simulateRouter from "./routes/simulate.js";

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

app.use("/simulate", simulateRouter);

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});
