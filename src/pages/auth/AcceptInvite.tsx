import { Link, useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill from "../../components/ui/Pill";
import AuthLayout from "../../components/auth/AuthLayout";
import { api, ApiError, setActiveOrgId } from "../../lib/api";
import { useAuth } from "../../contexts/AuthContext";
import { useOrg } from "../../contexts/OrgContext";
import { supabase } from "../../lib/supabase";
import type { InvitePeek, OrgWithRole } from "../../lib/types";

const AcceptInvite = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { session, signUp, signIn } = useAuth();
  const { refresh: refreshOrgs } = useOrg();

  const [peek, setPeek] = useState<InvitePeek | null>(null);
  const [peekError, setPeekError] = useState("");
  const [loading, setLoading] = useState(true);

  // Show the signup form whenever signup is incomplete — either the user is
  // brand new, OR their public.users row exists but has no name (row was
  // auto-provisioned by /orgs/mine before they typed anything). The backend
  // is the source of truth here; old auth.users metadata can lie.
  const needsSignup = Boolean(peek) && peek?.has_completed_signup !== true;

  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setPeekError("Missing invitation token.");
      setLoading(false);
      return;
    }
    api<InvitePeek>(`/api/v1/invitations/by-token/${token}`, {
      skipAuth: true,
      skipOrgHeader: true,
    })
      .then(setPeek)
      .catch((err) =>
        setPeekError(
          err instanceof ApiError
            ? err.detail
            : "Invitation could not be loaded."
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  const acceptOnBackend = (): Promise<OrgWithRole> =>
    api<OrgWithRole>(`/api/v1/invitations/${token}/accept`, {
      method: "POST",
      skipOrgHeader: true,
    });

  const handleNewUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peek || !token) return;
    if (!fullName.trim()) return setError("Your full name is required.");
    if (password.length < 8)
      return setError("Password must be at least 8 characters.");

    setError("");
    setSubmitting(true);
    try {
      const sessionEmail = session?.user?.email?.toLowerCase();
      const sessionMatchesInvitee =
        Boolean(sessionEmail) && sessionEmail === peek.email.toLowerCase();

      let credentialsSet = false;

      if (sessionMatchesInvitee) {
        // Supabase invite link path: there's a session for an
        // unpassworded auth.users row that belongs to this invitee.
        // Set password + name in place.
        const { error: updateErr } = await supabase.auth.updateUser({
          password,
          data: { full_name: fullName },
        });
        if (!updateErr) {
          credentialsSet = true;
        } else {
          // updateUser failed — typically because the JWT in this tab is
          // for an auth.users row that has since been deleted (e.g. the
          // invitee was previously removed from the team and our hard
          // delete wiped them). Sign out and fall through to signUp.
          await supabase.auth.signOut();
        }
      } else if (session) {
        // A different account is signed in in this tab (e.g. the owner
        // testing the invite). Sign them out so signUp doesn't clobber
        // anything and we land on the invitee's account.
        await supabase.auth.signOut();
      }

      if (!credentialsSet) {
        await signUp(peek.email, password, { full_name: fullName });
        await signIn(peek.email, password);
      }

      const org = await acceptOnBackend();
      setActiveOrgId(org.id);
      await refreshOrgs();
      navigate("/");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Could not finish accepting the invitation."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleExistingUser = async () => {
    if (!session) {
      navigate(`/login?next=/accept-invite/${token}`);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const org = await acceptOnBackend();
      setActiveOrgId(org.id);
      await refreshOrgs();
      navigate("/");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Failed to accept invite."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title={
        loading
          ? "Checking invitation..."
          : peek
          ? `Join ${peek.organization_name}`
          : "Invitation"
      }
      subtitle={
        peek ? (
          <span>
            Invited as <Pill variant="info">{peek.role}</Pill> using{" "}
            <span className="font-mono text-t2">{peek.email}</span>
          </span>
        ) as unknown as string : undefined
      }
    >
      {loading && <p className="text-[13px] text-t4">One moment…</p>}

      {!loading && peekError && (
        <div className="flex flex-col gap-4">
          <p className="text-[12px] text-err-fg">{peekError}</p>
          <Link
            to="/login"
            className="text-[12px] text-t3 hover:text-white underline underline-offset-2"
          >
            Go to sign in
          </Link>
        </div>
      )}

      {!loading && peek && peek.existing_user && !needsSignup && (
        <div className="flex flex-col gap-4">
          <p className="text-[13px] text-t3 leading-relaxed">
            This email already has a DocPilot account.{" "}
            {session
              ? "Click below to add this organization to your account."
              : "Sign in first, then return here to accept."}
          </p>
          {error && (
            <p className="font-mono text-[10px] text-err-fg">{error}</p>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={submitting}
            onClick={handleExistingUser}
          >
            {session
              ? submitting
                ? "Joining..."
                : "Accept invitation"
              : "Sign in to accept"}
          </Button>
        </div>
      )}

      {!loading && peek && (!peek.existing_user || needsSignup) && (
        <form onSubmit={handleNewUser} className="flex flex-col gap-4">
          <Input
            label="Your full name"
            type="text"
            placeholder="Jane Doe"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
          />
          <Input
            label="Set a password"
            type="password"
            placeholder="Min 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
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
            {submitting ? "Joining..." : "Accept & continue"}
          </Button>
        </form>
      )}
    </AuthLayout>
  );
};

export default AcceptInvite;
