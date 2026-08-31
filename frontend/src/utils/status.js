import { CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { STATUS } from "../data/mockData";

export const statusStyles = {
  [STATUS.PASS]: {
    label: "PASS",
    icon: CheckCircle2,
    text: "text-success-700",
    bg: "bg-success-50",
    border: "border-success-600/40",
    dot: "bg-success-600",
    solid: "bg-success-600",
  },
  [STATUS.REVIEW]: {
    label: "REVIEW",
    icon: AlertTriangle,
    text: "text-warning-700",
    bg: "bg-warning-50",
    border: "border-warning-600/40",
    dot: "bg-warning-600",
    solid: "bg-warning-600",
  },
  [STATUS.NON_COMPLIANT]: {
    label: "POTENTIAL NON-COMPLIANCE",
    icon: XCircle,
    text: "text-danger-700",
    bg: "bg-danger-50",
    border: "border-danger-600/40",
    dot: "bg-danger-600",
    solid: "bg-danger-600",
  },
};

export function scoreColor(score) {
  if (score >= 80) return "text-success-600";
  if (score >= 55) return "text-warning-600";
  return "text-danger-600";
}

export function formatDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const isToday = d.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();
  const time = d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
  if (isToday) return `Today, ${time}`;
  if (isYesterday) return `Yesterday, ${time}`;
  return `${d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}, ${time}`;
}
