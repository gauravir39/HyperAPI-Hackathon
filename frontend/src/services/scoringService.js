import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const scoringService = {
  estimateScore(payload, options = {}) {
    return apiClient.post(endpoints.scoring.estimate, payload, options);
  },
};
