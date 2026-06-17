import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import AuthLayout from "../../components/auth/AuthLayout";
import { api, ApiError, setActiveOrgId } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import type { SignupOrgResponse } from "../../lib/types";

interface FieldErrors {
  fullName?: string;
  orgName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

const SignupOrg = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { refresh: refreshOrgs } = useOrg();

  const [fullName, setFullName] = useState("");
  const [orgName, setOrgName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const validate = (): boolean => {
    const next: FieldErrors = {};
    if (!fullName.trim()) next.fullName = "Required";
    if (!orgName.trim()) next.orgName = "Required";
    if (!email.trim()) next.email = "Required";
    if (!password) next.password = "Required";
    else if (password.length < 8) next.password = "Min 8 characters";
    if (password !== confirmPassword) next.confirmPassword = "Passwords don't match";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    setSuccess("");
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await api<SignupOrgResponse>("/api/v1/auth/signup-org", {
        method: "POST",
        skipAuth: true,
        skipOrgHeader: true,
        body: {
          full_name: fullName,
          email,
          password,
          organization_name: orgName,
        },
      });

      if (res.email_confirmation_required) {
        setSuccess(res.message);
        return;
      }

      await signIn(email, password);
      setActiveOrgId(res.organization_id);
      await refreshOrgs();
      navigate("/");
    } catch (err) {
      setSubmitError(
        err instanceof ApiError ? err.detail : "Signup failed. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Start your organization"
      subtitle="Create the account that will own your DocPilot workspace. You can invite team members after."
      footer={
        <>
          Got an invitation link? Open it directly — no need to sign up here.
        </>
      }
    >
      {success ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-md border border-ok-line bg-ok-bg/40 px-4 py-3 text-[12px] text-ok-fg">
            {success}
          </div>
          <Link
            to="/login"
            className="text-[12px] text-t2 hover:text-white underline underline-offset-2"
          >
            → Go to sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input
            label="Your full name"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            error={errors.fullName}
          />
          <Input
            label="Organization name"
            type="text"
            placeholder="Acme Inc."
            value={orgName}
            onChange={(e) => setOrgName(e.target.value)}
            autoComplete="organization"
            error={errors.orgName}
          />
          <Input
            label="Work email"
            type="email"
            placeholder="you@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            error={errors.email}
          />
          <Input
            label="Password"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            error={errors.password}
          />
          <Input
            label="Confirm password"
            type="password"
            placeholder="Re-enter"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            error={errors.confirmPassword}
          />

          {submitError && (
            <p className="font-mono text-[10px] text-err-fg">{submitError}</p>
          )}

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={submitting}
          >
            {submitting ? "Creating..." : "Create organization"}
          </Button>

          <div className="text-[12px] text-t4 text-center mt-2">
            Already have an account?{" "}
            <Link
              to="/login"
              className="text-t2 hover:text-white underline underline-offset-2"
            >
              Sign in
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
};

export default SignupOrg;
