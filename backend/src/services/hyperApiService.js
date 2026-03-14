import { env } from "../config/env.js";

function buildHyperApiUrl(endpoint, query) {
  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
  const url = new URL(`${env.hyperApiBaseUrl}${normalizedEndpoint}`);

  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value === undefined || value === null || value === "") {
        return;
      }

      if (Array.isArray(value)) {
        value.forEach((item) => url.searchParams.append(key, String(item)));
        return;
      }

      url.searchParams.set(key, String(value));
    });
  }

  return url.toString();
}

function createTimeoutSignal(timeoutMs) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  return {
    signal: controller.signal,
    clear: () => clearTimeout(timeoutId),
  };
}

async function handleSuccessResponse(response) {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

async function handleErrorResponse(response, endpoint, method) {
  const errorText = await response.text().catch(() => "");
  const error = new Error(
    `Hyper API ${method} ${endpoint} failed: ${response.status}${errorText ? ` - ${errorText}` : ""}`
  );

  error.statusCode = response.status;
  error.details = errorText;

  throw error;
}

export async function sendHyperApiRequest(endpoint, options = {}) {
  const {
    method = "GET",
    body,
    query,
    headers = {},
    timeoutMs = env.hyperApiTimeoutMs,
  } = options;

  const { signal, clear } = createTimeoutSignal(timeoutMs);

  try {
    const response = await fetch(buildHyperApiUrl(endpoint, query), {
      method,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.hyperApiKey}`,
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });

    if (!response.ok) {
      await handleErrorResponse(response, endpoint, method);
    }

    return handleSuccessResponse(response);
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(`Hyper API ${method} ${endpoint} timed out after ${timeoutMs}ms`);
      timeoutError.code = "HYPER_API_TIMEOUT";
      throw timeoutError;
    }

    throw error;
  } finally {
    clear();
  }
}

export async function handleHyperApiSuccess(response) {
  return handleSuccessResponse(response);
}

export async function handleHyperApiError(response, endpoint, method) {
  return handleErrorResponse(response, endpoint, method);
}

export function createHyperApiTimeout(timeoutMs) {
  return createTimeoutSignal(timeoutMs);
}

export const hyperApiService = {
  request: sendHyperApiRequest,
  get(endpoint, options = {}) {
    return sendHyperApiRequest(endpoint, { ...options, method: "GET" });
  },
  post(endpoint, body, options = {}) {
    return sendHyperApiRequest(endpoint, { ...options, method: "POST", body });
  },
  put(endpoint, body, options = {}) {
    return sendHyperApiRequest(endpoint, { ...options, method: "PUT", body });
  },
  patch(endpoint, body, options = {}) {
    return sendHyperApiRequest(endpoint, { ...options, method: "PATCH", body });
  },
  delete(endpoint, options = {}) {
    return sendHyperApiRequest(endpoint, { ...options, method: "DELETE" });
  },
};
