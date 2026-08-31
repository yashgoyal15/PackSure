import { api } from "./client";

export function createInspection({ productName, category, packageType, images }) {
  const form = new FormData();
  form.append("product_name", productName || "Unidentified Package");
  if (category) form.append("category", category);
  if (packageType) form.append("package_type", packageType);
  images.forEach((img) => form.append("images", img.file, img.name));
  return api.post("/inspections", form, { isForm: true });
}

export function analyzeInspection(id) {
  return api.post(`/inspections/${id}/analyze`);
}

export function getInspection(id) {
  return api.get(`/inspections/${id}`);
}

export function listInspections({ q, status, scopeAll, page = 1, pageSize = 10 } = {}) {
  return api.get("/inspections", {
    q,
    status_filter: status,
    scope_all: scopeAll,
    page,
    page_size: pageSize,
  });
}

export function imagePath(imageId) {
  return `/inspections/images/${imageId}`;
}

/**
 * Adapts the backend's InspectionDetail shape into the shape the existing
 * UI components (AnalysisResultView, dashboard tables, etc.) already expect
 * — this keeps every component written for the mock-data prototype working
 * unchanged against real API responses.
 */
export function adaptInspection(apiInspection) {
  return {
    id: apiInspection.code,
    dbId: apiInspection.id,
    product: apiInspection.product_name,
    category: apiInspection.category,
    inspector: apiInspection.inspector?.name,
    date: apiInspection.created_at,
    score: apiInspection.score,
    status: apiInspection.status,
    images: apiInspection.images?.length ?? 0,
    ruleVersion: apiInspection.rule_version,
    rules: (apiInspection.rule_results || []).map((r) => ({
      id: r.rule_id,
      status: r.status,
      confidence: r.confidence,
      detail: r.detail,
      box:
        r.box_x != null
          ? { x: r.box_x, y: r.box_y, w: r.box_w, h: r.box_h }
          : null,
    })),
    rawImages: apiInspection.images || [],
  };
}

export function adaptListItem(item) {
  return {
    id: item.code,
    dbId: item.id,
    product: item.product_name,
    category: item.category,
    inspector: item.inspector?.name,
    date: item.created_at,
    score: item.score,
    status: item.status,
  };
}
