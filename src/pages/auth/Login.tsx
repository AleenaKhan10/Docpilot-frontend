import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import AuthLayout from "../../components/auth/AuthLayout";
import { useAuth } from "../../contexts/AuthContext";

const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await signIn(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Sign in to your workspace"
      subtitle="Turn screen recordings into structured, professional documentation — automatically."
      footer={
        <>
          By signing in you agree to the{" "}
          <span className="text-t3">Terms</span> and{" "}
          <span className="text-t3">Privacy Policy</span>.
        </>
      }
    >
      <form onSubmit={handleLogin} className="flex flex-col gap-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <p className="font-mono text-[10px] text-err-fg">{error}</p>
        )}

        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={submitting}
        >
          {submitting ? "Signing in..." : "Sign in"}
        </Button>

        <div className="flex items-center gap-2.5 my-2">
          <div className="flex-1 h-px bg-l1" />
          <span className="font-mono text-[9px] text-l4 uppercase">or</span>
          <div className="flex-1 h-px bg-l1" />
        </div>

        <div className="text-[12px] text-t4 text-center">
          New here?{" "}
          <Link
            to="/signup"
            className="text-t2 hover:text-white underline underline-offset-2"
          >
            Start an organization
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
};

export default Login;
