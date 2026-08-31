// Central mock dataset for the PackSure prototype.
// In production this would be served by the FastAPI backend described in the SRS.

export const STATUS = {
  PASS: "PASS",
  REVIEW: "REVIEW",
  NON_COMPLIANT: "POTENTIAL NON-COMPLIANCE",
};

export const RULE_CATALOG = [
  { id: "product_name", label: "Product / Common Name" },
  { id: "manufacturer", label: "Manufacturer / Packer / Importer" },
  { id: "address", label: "Address" },
  { id: "net_quantity", label: "Net Quantity" },
  { id: "mrp", label: "MRP Declaration" },
  { id: "mfg_info", label: "Manufacturing / Packing / Import Info" },
  { id: "consumer_care", label: "Consumer Care Details" },
  { id: "country_of_origin", label: "Country of Origin" },
  { id: "readability", label: "Readability / Font Prominence" },
];

export const inspections = [
  {
    id: "A214",
    product: "Basmati Rice, Premium Aged 5kg",
    category: "Food & Grocery",
    inspector: "R. Sharma",
    date: "2026-08-27T10:42:00",
    score: 68,
    status: STATUS.REVIEW,
    images: 2,
    ruleVersion: "v3.2",
    rules: [
      { id: "product_name", status: STATUS.PASS, confidence: 96, detail: "Detected: \u201cBasmati Rice, Premium Aged\u201d", box: { x: 8, y: 8, w: 46, h: 9 } },
      { id: "net_quantity", status: STATUS.PASS, confidence: 94, detail: "Detected: 5 kg \u2014 matches declared unit pattern", box: { x: 8, y: 20, w: 34, h: 9 } },
      { id: "mrp", status: STATUS.REVIEW, confidence: 54, detail: "Value partially obscured \u2014 confidence 54%, please verify", box: { x: 8, y: 32, w: 55, h: 9 } },
      { id: "manufacturer", status: STATUS.REVIEW, confidence: 0, detail: "No matching text region found on visible label", box: { x: 8, y: 44, w: 60, h: 11 } },
      { id: "address", status: STATUS.PASS, confidence: 88, detail: "Detected and matches expected format", box: null },
      { id: "consumer_care", status: STATUS.PASS, confidence: 91, detail: "Phone and email detected", box: null },
      { id: "country_of_origin", status: STATUS.PASS, confidence: 97, detail: "Detected: \u201cMade in India\u201d", box: null },
      { id: "readability", status: STATUS.PASS, confidence: 82, detail: "Text region size within expected range", box: null },
    ],
  },
  {
    id: "A213",
    product: "Mustard Oil, Kachi Ghani 1L",
    category: "Food & Grocery",
    inspector: "R. Sharma",
    date: "2026-08-27T09:15:00",
    score: 92,
    status: STATUS.PASS,
    images: 1,
    ruleVersion: "v3.2",
    rules: RULE_CATALOG.map((r, i) => ({
      id: r.id, status: STATUS.PASS, confidence: 90 + (i % 6),
      detail: "Detected and matches expected format", box: null,
    })),
  },
  {
    id: "A212",
    product: "Detergent Powder 1kg",
    category: "Household",
    inspector: "S. Verma",
    date: "2026-08-26T17:03:00",
    score: 41,
    status: STATUS.NON_COMPLIANT,
    images: 2,
    ruleVersion: "v3.2",
    rules: [
      { id: "product_name", status: STATUS.PASS, confidence: 91, detail: "Detected: \u201cDetergent Powder, Active Foam\u201d", box: null },
      { id: "net_quantity", status: STATUS.NON_COMPLIANT, confidence: 88, detail: "Declared 1kg but printed unit pattern does not match configured format", box: null },
      { id: "mrp", status: STATUS.NON_COMPLIANT, confidence: 90, detail: "No valid MRP value pattern found on any visible face", box: null },
      { id: "manufacturer", status: STATUS.NON_COMPLIANT, confidence: 85, detail: "Manufacturer field missing entirely", box: null },
      { id: "address", status: STATUS.REVIEW, confidence: 48, detail: "Partial address text detected, low confidence", box: null },
      { id: "consumer_care", status: STATUS.NON_COMPLIANT, confidence: 80, detail: "No contact details detected", box: null },
      { id: "country_of_origin", status: STATUS.PASS, confidence: 93, detail: "Detected: \u201cMade in India\u201d", box: null },
      { id: "readability", status: STATUS.REVIEW, confidence: 55, detail: "Text region smaller than expected for package size", box: null },
    ],
  },
  {
    id: "A211",
    product: "Glucose Biscuits 200g",
    category: "Food & Grocery",
    inspector: "S. Verma",
    date: "2026-08-26T14:20:00",
    score: 88,
    status: STATUS.PASS,
    images: 1,
    ruleVersion: "v3.2",
    rules: RULE_CATALOG.map((r, i) => ({
      id: r.id, status: i === 3 ? STATUS.REVIEW : STATUS.PASS, confidence: 85 + (i % 8),
      detail: i === 3 ? "MRP legible but partially glare-affected" : "Detected and matches expected format", box: null,
    })),
  },
  {
    id: "A210",
    product: "Herbal Toothpaste 100g",
    category: "Personal Care",
    inspector: "R. Sharma",
    date: "2026-08-26T11:05:00",
    score: 95,
    status: STATUS.PASS,
    images: 2,
    ruleVersion: "v3.1",
    rules: RULE_CATALOG.map((r) => ({ id: r.id, status: STATUS.PASS, confidence: 93, detail: "Detected and matches expected format", box: null })),
  },
  {
    id: "A209",
    product: "Instant Noodles, Masala 70g",
    category: "Food & Grocery",
    inspector: "A. Iyer",
    date: "2026-08-25T16:40:00",
    score: 57,
    status: STATUS.REVIEW,
    images: 1,
    ruleVersion: "v3.1",
    rules: RULE_CATALOG.map((r, i) => ({
      id: r.id, status: i % 3 === 0 ? STATUS.REVIEW : STATUS.PASS, confidence: 60 + (i % 5) * 4,
      detail: i % 3 === 0 ? "Low OCR confidence, manual check required" : "Detected and matches expected format", box: null,
    })),
  },
  {
    id: "A208",
    product: "Dark Chocolate Bar 40g",
    category: "Food & Grocery",
    inspector: "A. Iyer",
    date: "2026-08-25T15:12:00",
    score: 34,
    status: STATUS.NON_COMPLIANT,
    images: 1,
    ruleVersion: "v3.1",
    rules: RULE_CATALOG.map((r, i) => ({
      id: r.id, status: i < 4 ? STATUS.NON_COMPLIANT : STATUS.PASS, confidence: 70 + i,
      detail: i < 4 ? "Required declaration missing or invalid" : "Detected and matches expected format", box: null,
    })),
  },
  {
    id: "A207",
    product: "Liquid Hand Wash 250ml",
    category: "Personal Care",
    inspector: "S. Verma",
    date: "2026-08-24T12:02:00",
    score: 90,
    status: STATUS.PASS,
    images: 1,
    ruleVersion: "v3.1",
    rules: RULE_CATALOG.map((r) => ({ id: r.id, status: STATUS.PASS, confidence: 90, detail: "Detected and matches expected format", box: null })),
  },
];

export function ruleLabel(id) {
  return RULE_CATALOG.find((r) => r.id === id)?.label ?? id;
}

export function getInspection(id) {
  return inspections.find((i) => i.id === id);
}

export function summarizeRules(rules) {
  return rules.reduce(
    (acc, r) => {
      if (r.status === STATUS.PASS) acc.pass += 1;
      else if (r.status === STATUS.REVIEW) acc.review += 1;
      else acc.nonCompliant += 1;
      return acc;
    },
    { pass: 0, review: 0, nonCompliant: 0 }
  );
}

export const dashboardTrend = [
  { day: "Mon", pass: 14, review: 4, nonCompliant: 2 },
  { day: "Tue", pass: 18, review: 6, nonCompliant: 3 },
  { day: "Wed", pass: 12, review: 5, nonCompliant: 4 },
  { day: "Thu", pass: 20, review: 3, nonCompliant: 1 },
  { day: "Fri", pass: 22, review: 7, nonCompliant: 5 },
  { day: "Sat", pass: 16, review: 4, nonCompliant: 3 },
  { day: "Sun", pass: 10, review: 2, nonCompliant: 1 },
];

export const violationCategories = [
  { label: "MRP Declaration", pct: 38 },
  { label: "Net Quantity", pct: 29 },
  { label: "Manufacturer Info", pct: 21 },
  { label: "Consumer Care", pct: 12 },
];

export const kpis = {
  total: 128,
  pass: 74,
  review: 31,
  nonCompliant: 23,
};

export const teamUsers = [
  { id: "u1", name: "Ramesh Sharma", email: "r.sharma@dept.gov.in", role: "Inspector", status: "Active", inspections: 42 },
  { id: "u2", name: "Sunita Verma", email: "s.verma@dept.gov.in", role: "Inspector", status: "Active", inspections: 38 },
  { id: "u3", name: "Arjun Iyer", email: "a.iyer@dept.gov.in", role: "Inspector", status: "Active", inspections: 21 },
  { id: "u4", name: "Priya Nair", email: "p.nair@dept.gov.in", role: "Administrator", status: "Active", inspections: 5 },
  { id: "u5", name: "Vikram Singh", email: "v.singh@dept.gov.in", role: "Inspector", status: "Invited", inspections: 0 },
];

export const complianceRules = [
  { id: "r1", category: "Net Quantity", rule: "Must declare quantity in standard SI unit with numeric pattern", severity: "High", status: "Active" },
  { id: "r2", category: "MRP", rule: "MRP must be prefixed with currency symbol and be a valid decimal", severity: "High", status: "Active" },
  { id: "r3", category: "Manufacturer", rule: "Manufacturer / packer / importer name and address required", severity: "High", status: "Active" },
  { id: "r4", category: "Consumer Care", rule: "Valid phone number or email required for consumer complaints", severity: "Medium", status: "Active" },
  { id: "r5", category: "Country of Origin", rule: "Country of origin required for imported goods", severity: "Medium", status: "Active" },
  { id: "r6", category: "Readability", rule: "Minimum text height relative to package face area", severity: "Low", status: "Draft" },
];
