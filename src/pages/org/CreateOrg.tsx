import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import AuthLayout from "../../components/auth/AuthLayout";
import { api, ApiError, setActiveOrgId } from "../../lib/api";
import { useOrg } from "../../contexts/OrgContext";
import type { OrgWithRole } from "../../lib/types";

const CreateOrg = () => {
  const navigate = useNavigate();
  const { refresh } = useOrg();
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setError("");
    setSubmitting(true);
    try {
      const org = await api<OrgWithRole>("/api/v1/orgs/", {
        method: "POST",
        skipOrgHeader: true,
        body: { name },
      });
      setActiveOrgId(org.id);
      await refresh();
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.detail : "Failed to create org.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create an organization"
      subtitle="Spin up a fresh workspace. You'll be its owner and can invite teammates from inside."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Organization name"
          placeholder="Acme Inc."
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        {error && (
          <p className="font-mono text-[10px] text-err-fg">{error}</p>
        )}
        <Button
          type="submit"
          variant="primary"
          className="w-full mt-2"
          disabled={submitting || !name.trim()}
        >
          {submitting ? "Creating..." : "Create organization"}
        </Button>
      </form>
    </AuthLayout>
  );
};

export default CreateOrg;
