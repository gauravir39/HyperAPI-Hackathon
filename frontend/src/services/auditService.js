import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const auditService = {
  runAudit(payload, options = {}) {
    return apiClient.post(endpoints.audit.run, payload, options);
  },
};
