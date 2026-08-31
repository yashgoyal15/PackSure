import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import Button from "../components/ui/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-ink-50">
      <div className="h-16 w-16 rounded-2xl bg-white border border-ink-200 flex items-center justify-center mb-5 shadow-sm">
        <ShieldAlert className="h-8 w-8 text-ink-400" />
      </div>
      <h1 className="text-3xl font-extrabold text-ink-800">Page not found</h1>
      <p className="text-sm text-ink-500 mt-2 max-w-sm">The page you're looking for doesn't exist or may have been moved.</p>
      <Button as={Link} to="/" className="mt-6">Back to Home</Button>
    </div>
  );
}
