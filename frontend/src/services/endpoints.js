export const endpoints = {
  bootstrap: {
    get: "/api/bootstrap",
  },
  audit: {
    run: "/api/audit/run",
  },
  vendors: {
    list: "/api/vendors",
    detail: (vendorId) => `/api/vendors/${vendorId}`,
  },
  documents: {
    list: "/api/documents",
    detail: (documentId) => `/api/documents/${documentId}`,
  },
  findings: {
    list: "/api/findings",
    detail: (findingId) => `/api/findings/${findingId}`,
  },
  scoring: {
    estimate: "/api/scoring/estimate",
  },
  submissions: {
    validate: "/api/submissions/validate",
    create: "/api/submissions",
  },
};
