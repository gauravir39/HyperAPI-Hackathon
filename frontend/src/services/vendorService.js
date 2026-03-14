import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const vendorService = {
  listVendors(query = {}, options = {}) {
    return apiClient.get(endpoints.vendors.list, { ...options, query });
  },

  getVendorById(vendorId, options = {}) {
    return apiClient.get(endpoints.vendors.detail(vendorId), options);
  },
};
