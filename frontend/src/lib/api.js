import { auditService, bootstrapService } from "../services";

export function fetchBootstrapData(options) {
  return bootstrapService.getBootstrap(options);
}

export function runAuditRequest(payload, options) {
  return auditService.runAudit(payload, options);
}
