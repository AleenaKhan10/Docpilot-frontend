import { Mail, Trash2 } from "lucide-react";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Select from "../../components/ui/Select";
import Pill, { type PillVariant } from "../../components/ui/Pill";
import IconButton from "../../components/ui/IconButton";
import MainLayout from "../../components/layout/MainLayout";
import TableSkeleton from "../../components/ui/TableSkeleton";
import { api, ApiError } from "../../lib/api";
import { queryKeys } from "../../lib/query-client";
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
  const queryClient = useQueryClient();
  const orgId = activeOrg?.id;

  const myRole = activeOrg?.role as Role | undefined;
  const isOwner = myRole === "owner";
  const isAdminOrAbove = myRole === "owner" || myRole === "admin";
  const myRank = myRole ? ROLE_RANK[myRole] : -1;

  // Owner can invite any non-owner role; admin can invite member/guest only.
  const invitableRoles: Role[] = isOwner
    ? ["admin", "member", "guest"]
    : ["member", "guest"];

  const membersQuery = useQuery({
    queryKey: orgId ? queryKeys.members(orgId) : ["members", "none"],
    queryFn: () => api<Member[]>("/api/v1/orgs/members"),
    enabled: Boolean(orgId),
  });

  const invitationsQuery = useQuery({
    queryKey: orgId ? queryKeys.invitations(orgId) : ["invitations", "none"],
    queryFn: () => api<Invitation[]>("/api/v1/invitations/"),
    enabled: Boolean(orgId) && isAdminOrAbove,
  });

  const members = membersQuery.data ?? [];
  const invites = invitationsQuery.data ?? [];
  const loadError =
    membersQuery.error instanceof ApiError
      ? membersQuery.error.detail
      : membersQuery.error
      ? "Failed to load team."
      : "";

  // After any mutation, blow away the team caches so the next read pulls
  // fresh data. Invitations have their own key so we also touch them.
  const invalidateTeam = () => {
    if (!orgId) return;
    queryClient.invalidateQueries({ queryKey: queryKeys.members(orgId) });
    queryClient.invalidateQueries({ queryKey: queryKeys.invitations(orgId) });
  };

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<Role>("guest");
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");

  const inviteMutation = useMutation({
    mutationFn: (body: { email: string; role: Role }) =>
      api<Invitation>("/api/v1/invitations/", { method: "POST", body }),
    onSuccess: (_data, vars) => {
      setInviteSuccess(
        `Invitation sent to ${vars.email} as ${ROLE_LABEL[vars.role]}.`
      );
      setInviteEmail("");
      invalidateTeam();
    },
    onError: (err) =>
      setInviteError(err instanceof ApiError ? err.detail : "Failed to send invite."),
  });

  const revokeMutation = useMutation({
    mutationFn: (id: string) =>
      api(`/api/v1/invitations/${id}`, { method: "DELETE" }),
    onSuccess: invalidateTeam,
    onError: (err) =>
      alert(err instanceof ApiError ? err.detail : "Failed to revoke."),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      api(`/api/v1/orgs/members/${userId}`, { method: "DELETE" }),
    onSuccess: invalidateTeam,
    onError: (err) =>
      alert(err instanceof ApiError ? err.detail : "Failed to remove."),
  });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: Role }) =>
      api(`/api/v1/orgs/members/${userId}/role`, {
        method: "PUT",
        body: { role },
      }),
    onSuccess: invalidateTeam,
    onError: (err) =>
      alert(err instanceof ApiError ? err.detail : "Failed to update role."),
  });

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    setInviteError("");
    setInviteSuccess("");
    const email = inviteEmail.trim();
    if (!email) return;
    inviteMutation.mutate({ email, role: inviteRole });
  };

  const handleRemove = (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from the organization?`)) return;
    removeMutation.mutate(userId);
  };

  /** Can the current caller act on this member (change role / remove)? */
  const canManage = (m: Member) => {
    if (!isAdminOrAbove) return false;
    if (isOwner) return true;
    return ROLE_RANK[m.role] < myRank;
  };

  const seatsUsed =
    members.length + invites.filter((i) => i.status === "pending").length;
  const seatsTotal = activeOrg?.max_seats ?? 0;
  const showInitialLoading = membersQuery.isLoading && members.length === 0;

  return (
    <MainLayout
      breadcrumbs={[
        { label: activeOrg?.name ?? "Workspace" },
        { label: "Team" },
      ]}
    >
      <div className="px-6 py-6 max-w-[1100px]">
        <div className="flex items-end justify-between mb-5">
          <div>
            <h1 className="text-[20px] font-semibold tracking-tight text-white">
              Team
            </h1>
            <p className="text-[12px] text-t4 mt-0.5">
              Manage who can access this organization and what they can do.
            </p>
          </div>
          <div className="font-mono text-[10px] text-t5">
            {seatsUsed} / {seatsTotal} seats used
          </div>
        </div>

        {loadError && (
          <div className="font-mono text-[10px] text-err-fg mb-4">
            {loadError}
          </div>
        )}

        {isAdminOrAbove && (
          <div className="bg-s1 border border-l1 rounded-md p-5 mb-6">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-3">
              Invite a teammate
            </div>
            <form
              onSubmit={handleInvite}
              className="flex flex-col md:flex-row gap-3 md:items-end"
            >
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
                <Select
                  label="Role"
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as Role)}
                >
                  {invitableRoles.map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                type="submit"
                variant="primary"
                disabled={inviteMutation.isPending}
              >
                {inviteMutation.isPending ? "Sending..." : "Send invite"}
              </Button>
            </form>
            {inviteError && (
              <p className="font-mono text-[10px] text-err-fg mt-3">
                {inviteError}
              </p>
            )}
            {inviteSuccess && (
              <p className="font-mono text-[10px] text-ok-fg mt-3">
                {inviteSuccess}
              </p>
            )}
          </div>
        )}

        <div className="bg-s1 border border-l1 rounded-md overflow-hidden mb-6">
          <div className="px-4 py-2.5 border-b border-l1 flex items-center justify-between">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5">
              Members ({members.length})
            </div>
          </div>
          {showInitialLoading ? (
            <TableSkeleton rows={4} cols={6} />
          ) : (
            <table className="w-full text-[12px]">
              <thead>
                <tr className="bg-s2">
                  {["Name", "Email", "Role", "Status", "Joined", ""].map(
                    (h, i) => (
                      <th
                        key={i}
                        className="px-4 py-2 text-left font-mono text-[9px] uppercase tracking-wide text-t5 border-b border-l1"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody>
                {members.map((m) => {
                  const manageable = canManage(m);
                  const targetRoles: Role[] = isOwner
                    ? ["owner", "admin", "member", "guest"]
                    : ["member", "guest"];
                  return (
                    <tr
                      key={m.user_id}
                      className="border-b border-l1 last:border-0"
                    >
                      <td className="px-4 py-2.5 text-t2 font-medium">
                        {m.full_name ?? "—"}
                      </td>
                      <td className="px-4 py-2.5 font-mono text-[11px] text-t4">
                        {m.email}
                      </td>
                      <td className="px-4 py-2.5">
                        {manageable ? (
                          <div className="w-[120px]">
                            <Select
                              selectSize="sm"
                              value={m.role}
                              onChange={(e) =>
                                roleMutation.mutate({
                                  userId: m.user_id,
                                  role: e.target.value as Role,
                                })
                              }
                            >
                              {targetRoles.map((r) => (
                                <option key={r} value={r}>
                                  {ROLE_LABEL[r]}
                                </option>
                              ))}
                            </Select>
                          </div>
                        ) : (
                          <Pill variant={ROLE_VARIANT[m.role]}>
                            {ROLE_LABEL[m.role]}
                          </Pill>
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
                    <td className="px-4 py-2.5 font-mono text-[11px] text-t4">
                      {i.email}
                    </td>
                    <td className="px-4 py-2.5">
                      <Pill variant={ROLE_VARIANT[i.role]}>
                        {ROLE_LABEL[i.role]}
                      </Pill>
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
                        onClick={() => revokeMutation.mutate(i.id)}
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
