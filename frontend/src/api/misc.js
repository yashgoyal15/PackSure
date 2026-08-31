import { api } from "./client";

export function getDashboard(scopeAll = false) {
  return api.get("/dashboard", { scope_all: scopeAll });
}

export function listUsers() {
  return api.get("/users");
}

export function inviteUser({ name, email, role }) {
  return api.post("/users", { name, email, role });
}

export function listRules() {
  return api.get("/rules");
}

export function createRule({ category, ruleText, severity, status }) {
  return api.post("/rules", { category, rule_text: ruleText, severity, status });
}

export function reportPdfUrl(dbId) {
  return `/reports/${dbId}/pdf`;
}
