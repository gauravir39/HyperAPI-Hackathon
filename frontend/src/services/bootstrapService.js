import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const bootstrapService = {
  getBootstrap(options = {}) {
    return apiClient.get(endpoints.bootstrap.get, options);
  },
};
