import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const submissionService = {
  validateSubmission(payload, options = {}) {
    return apiClient.post(endpoints.submissions.validate, payload, options);
  },

  createSubmission(payload, options = {}) {
    return apiClient.post(endpoints.submissions.create, payload, options);
  },
};
