import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ShieldCheck, ScanLine, FileCheck2, AlertCircle, ArrowRight } from "lucide-react";
import { useApp } from "../context/AppContext";
import { ApiError } from "../api/client";
import { Input } from "../components/ui/Primitives";
import Button from "../components/ui/Button";
import ScanBackground from "../components/landing/ScanBackground";

const bullets = [
  { icon: ScanLine, text: "Scan a package label in seconds" },
  { icon: ShieldCheck, text: "Rule-based compliance screening" },
  { icon: FileCheck2, text: "Explainable, evidence-backed results" },
];

const DEMO_ACCOUNTS = [
  { label: "Inspector demo", email: "r.sharma@dept.gov.in" },
  { label: "Administrator demo", email: "p.nair@dept.gov.in" },
];
const DEMO_PASSWORD = "password123";

export default function Login() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email || !password) {
      setError("Please enter both your email and password.");
      return;
    }
    setLoading(true);
    try {
      await login(email, password);
      navigate("/app/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const quickFill = (demoEmail) => {
    setEmail(demoEmail);
    setPassword(DEMO_PASSWORD);
    setError("");
  };

  return (
    <div className="min-h-screen flex">
      {/* Brand panel */}
      <div className="relative hidden lg:flex lg:w-[46%] flex-col justify-between p-12 overflow-hidden">
        <ScanBackground />
        <Link to="/" className="relative flex items-center gap-2.5">
          <div className="h-11 w-11 rounded-2xl bg-white flex items-center justify-center shadow-lg">
            <ShieldCheck className="h-6 w-6 text-primary-700" />
          </div>
          <span className="font-extrabold text-xl text-white">
            Pack<span className="text-accent-300">Sure</span>
          </span>
        </Link>

        <div className="relative">
          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight">
            AI-assisted packaged<br />commodity compliance<br />screening
          </h1>
          <div className="mt-8 space-y-3">
            {bullets.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-primary-50">
                <div className="h-8 w-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <span className="text-sm font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-primary-200/70">
          Smart India Hackathon 2026 &middot; Problem Statement 26034
        </p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-ink-50">
        <div className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-2.5 mb-8 justify-center">
            <div className="h-10 w-10 rounded-xl bg-primary-600 flex items-center justify-center">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <span className="font-extrabold text-lg text-ink-800">
              Pack<span className="text-primary-600">Sure</span>
            </span>
          </div>

          <h2 className="text-2xl font-extrabold text-ink-800">Sign in to your account</h2>
          <p className="text-sm text-ink-500 mt-1.5">Enter your credentials to access the inspection console</p>

          <div className="flex gap-2 mt-6">
            {DEMO_ACCOUNTS.map((d) => (
              <button
                key={d.email}
                type="button"
                onClick={() => quickFill(d.email)}
                className="flex-1 h-9 rounded-lg border border-ink-200 bg-white text-xs font-bold text-ink-600 hover:border-primary-300 hover:text-primary-700 transition-colors"
              >
                {d.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <Input
              label="Email Address"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="inspector@dept.gov.in"
            />
            <Input
              label="Password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022"
            />

            <div className="flex items-center justify-between text-xs">
              <label className="flex items-center gap-2 text-ink-500">
                <input type="checkbox" className="rounded border-ink-300" defaultChecked />
                Remember me
              </label>
              <a href="#" className="font-semibold text-primary-600 hover:underline">Forgot password?</a>
            </div>

            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-danger-50 border border-danger-200 text-danger-700 text-xs font-semibold px-3.5 py-3">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full" size="lg" loading={loading} iconRight={ArrowRight}>
              {loading ? "" : "Sign In"}
            </Button>
          </form>

          <div className="mt-6 rounded-xl bg-white border border-ink-200 px-4 py-3.5 text-xs text-ink-500 flex gap-2.5">
            <ShieldCheck className="h-4 w-4 text-ink-400 shrink-0 mt-0.5" />
            <span>Government use only. Screening results are decision-support, not legal certification.</span>
          </div>

          <p className="text-center text-xs text-ink-400 mt-6">
            <Link to="/" className="hover:text-ink-600 font-medium">&larr; Back to homepage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
