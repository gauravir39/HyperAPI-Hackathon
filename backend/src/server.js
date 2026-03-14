import http from "node:http";
import { env } from "./config/env.js";
import { documents, findings, vendorMaster } from "./data/mockData.js";
import { runMockAudit } from "./lib/mockAuditEngine.js";
import { sendHyperApiRequest } from "./services/hyperApiService.js";

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  response.end(JSON.stringify(payload));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let data = "";
    request.on("data", (chunk) => {
      data += chunk;
    });
    request.on("end", () => {
      if (!data) {
        resolve({});
        return;
      }

      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    request.on("error", reject);
  });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", `http://${request.headers.host}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, {});
    return;
  }

  if (request.method === "GET" && url.pathname === "/api/bootstrap") {
    sendJson(response, 200, {
      vendorMaster,
      documents,
      findings,
      mode: "mock-demo",
    });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/audit/run") {
    try {
      const body = await readJson(request);
      const result = runMockAudit(documents, vendorMaster);

      sendJson(response, 200, {
        ...result,
        datasetName: body.datasetName ?? "global_audit_financial_dump.pdf",
        mode: "mock-demo",
      });
    } catch (error) {
      sendJson(response, 400, {
        error: "Invalid request body",
        details: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/hyper/request") {
    try {
      const body = await readJson(request);
      const result = await sendHyperApiRequest(body.endpoint ?? "/", {
        method: body.method ?? "GET",
        body: body.payload,
        query: body.query,
        headers: body.headers,
        timeoutMs: body.timeoutMs,
      });

      sendJson(response, 200, {
        success: true,
        data: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/hyper/audit-run") {
    try {
      const body = await readJson(request);
      const result = await sendHyperApiRequest(env.hyperApiAuditEndpoint, {
        method: "POST",
        body,
      });

      sendJson(response, 200, {
        success: true,
        data: result,
      });
    } catch (error) {
      sendJson(response, 500, {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return;
  }

  sendJson(response, 404, { error: "Not found" });
});

server.listen(env.port, () => {
  console.log(`FinNeedle AI backend listening on http://localhost:${env.port}`);
});
