import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const findingsService = {
  listFindings(query = {}, options = {}) {
    return apiClient.get(endpoints.findings.list, { ...options, query });
  },

  getFindingById(findingId, options = {}) {
    return apiClient.get(endpoints.findings.detail(findingId), options);
  },
};
