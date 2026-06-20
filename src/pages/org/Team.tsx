import { Mail, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Pill, { type PillVariant } from "../../components/ui/Pill";
import IconButton from "../../components/ui/IconButton";
import MainLayout from "../../components/layout/MainLayout";
import { api, ApiError } from "../../lib/api";
import { useOrg } from "../../contexts/OrgContext";
import type { Invitation, Member, Role } from "../../lib/types";

// Higher number = more powerful role. Mirrors backend api.debs.role_rank.
const ROLE_RANK: Record<Role, number> = {
  guest: 0,
  member: 1,
  admin: 2,
  owner: 3,
};

const ROLE_VARIANT: Record<Role, PillVariant> = {
  owner: "yellow",
  admin: "purple",
  member: "info",
  guest: "neutral",
};

const ROLE_LABEL: Record<Role, string> = {
  owner: "Owner",
  admin: "Admin",
  member: "Member",
  guest: "Guest",
};

const Team = () => {
  const { activeOrg } = useOrg();
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("guest");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const myRole = activeOrg?.role as Role | undefined;
  const isOwner = myRole === "owner";
  const isAdminOrAbove = myRole === "owner" || myRole === "admin";
  const myRank = myRole ? ROLE_RANK[myRole] : -1;

  // Owner can invite any non-owner role; admin can invite member/guest only.
  const invitableRoles: Role[] = isOwner
    ? ["admin", "member", "guest"]
    : ["member", "guest"];

  const load = async () => {
    setLoading(true);
    setLoadError("");
    try {
      const m = await api<Member[]>("/api/v1/orgs/members");
      setMembers(m);
      if (isAdminOrAbove) {
        const i = await api<Invitation[]>("/api/v1/invitations/");
        setInvites(i);
      } else {
        setInvites([]);
      }
    } catch (err) {
      setLoadError(err instanceof ApiError ? err.detail : "Failed to load team.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeOrg) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOrg?.id, myRole]);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await api<Invitation>("/api/v1/invitations/", {
        method: "POST",
        body: { email: inviteEmail.trim(), role: inviteRole },
      });
      setInviteSuccess(
        `Invitation sent to ${inviteEmail} as ${ROLE_LABEL[inviteRole]}.`
      );
      setInviteEmail("");
      await load();
    } catch (err) {
      setInviteError(err instanceof ApiError ? err.detail : "Failed to send invite.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevoke = async (id: string) => {
    try {
      await api(`/api/v1/invitations/${id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Failed to revoke.");
    }
  };

  const handleRemove = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from the organization?`)) return;
    try {
      await api(`/api/v1/orgs/members/${userId}`, { method: "DELETE" });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Failed to remove.");
    }
  };

  const handleChangeRole = async (userId: string, next: Role) => {
    try {
      await api(`/api/v1/orgs/members/${userId}/role`, {
        method: "PUT",
        body: { role: next },
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Failed to update role.");
    }
  };

  /** Can the current caller act on this member (change role / remove)? */
  const canManage = (m: Member) => {
    if (!isAdminOrAbove) return false;
    if (isOwner) {
      // Owner can manage anyone except can't demote/remove last owner
      // (the backend enforces it; we still surface the controls).
      return true;
    }
    // Admin: only members strictly below admin rank.
    return ROLE_RANK[m.role] < myRank;
  };

  const seatsUsed = members.length + invites.filter((i) => i.status === "pending").length;
  const seatsTotal = activeOrg?.max_seats ?? 0;

  return (
    <MainLayout breadcrumbs={[{ label: activeOrg?.name ?? "Workspace" }, { label: "Team" }]}>
      <div className="px-6 py-6 max-w-[1100px]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white">Team</h1>
            <p className="text-[12px] text-t4 mt-0.5">
              Manage who can access this organization and what they can do.
            </p>
          </div>
          <div className="font-mono text-[10px] text-t5">
            {seatsUsed} / {seatsTotal} seats used
          </div>
        </div>

        {loadError && (
          <div className="font-mono text-[10px] text-err-fg mb-4">{loadError}</div>
        )}

        {isAdminOrAbove && (
          <div className="bg-s1 border border-l1 rounded-md p-5 mb-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-3">
              Invite a teammate
            </div>
            <form onSubmit={handleInvite} className="flex flex-col md:flex-row gap-3 md:items-end">
              <div className="flex-1">
                <Input
                  label="Email"
                  type="email"
                  placeholder="teammate@example.com"
                  leftIcon={<Mail size={13} />}
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              <div className="md:w-44">
                <label className="font-mono text-[9px] font-medium uppercase tracking-[0.08em] text-t5 mb-1.5 block">
                  Role
                </label>
                <select
                  className="w-full h-[38px] px-3 rounded-sm bg-s2 border border-l1 text-t1 text-[13px] outline-none focus:border-l3"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                >
                  {invitableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </select>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={inviting}
              >
                {inviting ? "Sending..." : "Send invite"}
              </Button>
            </form>
            {inviteError && (
              <p className="font-mono text-[10px] text-err-fg mt-3">{inviteError}</p>
            )}
            {inviteSuccess && (
              <p className="font-mono text-[10px] text-ok-fg mt-3">{inviteSuccess}</p>
            )}
          </div>
        )}

        <div className="bg-s1 border border-l1 rounded-md overflow-hidden mb-6">
          <div className="px-4 py-2.5 border-b border-l1 flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5">
              Members ({members.length})
            </div>
          </div>
          {loading ? (
            <div className="px-4 py-8 text-center text-[12px] text-t5">Loading…</div>
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-s2">
                  {["Name", "Email", "Role", "Status", "Joined", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const manageable = canManage(m);
                  // What roles can the caller set this member to?
                  const targetRoles: Role[] = isOwner
                    ? ["owner", "admin", "member", "guest"]
                    : ["member", "guest"]; // admin can only set strictly below admin
                  return (
                    <tr key={m.user_id} className="border-b border-l1 last:border-0">
                      <td className="px-4 py-2.5 text-t2 font-medium">
                        {m.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t4">
                        {m.email}
                      </td>
                      <td className="px-4 py-2.5">
                        {manageable ? (
                          <select
                            value={m.role}
                            onChange={(e) =>
                              handleChangeRole(m.user_id, e.target.value as Role)
                            }
                            className="bg-s2 border border-l1 rounded-sm px-2 py-1 text-[11px] text-t1 outline-none focus:border-l3"
                          >
                            {targetRoles.map((r) => (
                              <option key={r} value={r}>
                                {ROLE_LABEL[r]}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <Pill variant={ROLE_VARIANT[m.role]}>{ROLE_LABEL[m.role]}</Pill>
                        )}
                      </td>
                      <td className="px-4 py-2.5">
                        <Pill variant="ok">Active</Pill>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                        {new Date(m.joined_at).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {manageable && m.role !== "owner" && (
                          <IconButton
                            size="sm"
                            aria-label="Remove member"
                            onClick={() => handleRemove(m.user_id, m.email)}
                          >
                            <Trash2 size={12} />
                          </IconButton>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {isAdminOrAbove && invites.length > 0 && (
          <div className="bg-s1 border border-l1 rounded-md overflow-hidden">
            <div className="px-4 py-2.5 border-b border-l1 flex items-center gap-2">
              <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5">
                Pending invitations ({invites.length})
              </span>
              <span className="font-mono text-[10px] text-t4">
                — these people haven't accepted yet
              </span>
            </div>
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-s2">
                  {["Email", "Role", "Status", "Sent", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map((i) => (
                  <tr key={i.id} className="border-b border-l1 last:border-0">
                    <td className="px-4 py-2.5 font-mono text-[11px] text-t4">{i.email}</td>
                    <td className="px-4 py-2.5">
                      <Pill variant={ROLE_VARIANT[i.role]}>{ROLE_LABEL[i.role]}</Pill>
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill variant="yellow">Pending</Pill>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-[11px] text-t5">
                      {new Date(i.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2.5 text-right">
                      <IconButton
                        size="sm"
                        aria-label="Revoke invitation"
                        onClick={() => handleRevoke(i.id)}
                      >
                        <Trash2 size={12} />
                      </IconButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Team;
