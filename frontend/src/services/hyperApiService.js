export async function hyperApiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    query,
    signal,
    timeoutMs,
  } = options;

  try {
    const response = await fetch("/api/hyper/request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        endpoint,
        method,
        payload: body,
        query,
        timeoutMs,
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Hyper API proxy failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`);
    }

    const payload = await response.json();
    if (!payload.success) {
      throw new Error(payload.error ?? "Hyper API request failed");
    }

    return payload.data;
  } catch (error) {
    console.error("HyperAPI request error:", error);
    throw error;
  }
}

export async function submitAuditToHyperApi(payload, options = {}) {
  const { signal } = options;

  try {
    const response = await fetch("/api/hyper/audit-run", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "");
      throw new Error(`Hyper API audit proxy failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`);
    }

    const proxyPayload = await response.json();
    if (!proxyPayload.success) {
      throw new Error(proxyPayload.error ?? "Hyper API audit request failed");
    }

    return proxyPayload.data;
  } catch (error) {
    console.error("HyperAPI audit request error:", error);
    throw error;
  }
}

export const hyperApiService = {
  request: hyperApiRequest,
  submitAudit: submitAuditToHyperApi,

  get(endpoint, options = {}) {
    return hyperApiRequest(endpoint, { ...options, method: "GET" });
  },

  post(endpoint, body, options = {}) {
    return hyperApiRequest(endpoint, { ...options, method: "POST", body });
  },

  put(endpoint, body, options = {}) {
    return hyperApiRequest(endpoint, { ...options, method: "PUT", body });
  },

  patch(endpoint, body, options = {}) {
    return hyperApiRequest(endpoint, { ...options, method: "PATCH", body });
  },

  delete(endpoint, options = {}) {
    return hyperApiRequest(endpoint, { ...options, method: "DELETE" });
  },
};
