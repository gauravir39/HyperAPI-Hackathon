import { apiClient } from "./apiClient";
import { endpoints } from "./endpoints";

export const documentService = {
  listDocuments(query = {}, options = {}) {
    return apiClient.get(endpoints.documents.list, { ...options, query });
  },

  getDocumentById(documentId, options = {}) {
    return apiClient.get(endpoints.documents.detail(documentId), options);
  },
};
