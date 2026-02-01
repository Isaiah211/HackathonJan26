import axios from "axios";

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:9000";

export async function fetchBusinessImpactPrediction(payload) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}/predict`, {
      businessType: payload.businessType,
      scale: payload.scale,
      locationKey: payload.locationKey,
      locationLabel: payload.locationLabel,
      contextSignals: payload.contextSignals,
      query: payload.query,
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      const message = error.response.data?.detail || error.response.data?.error || error.message;
      const err = new Error(message);
      err.status = error.response.status;
      throw err;
    }
    throw error;
  }
}
