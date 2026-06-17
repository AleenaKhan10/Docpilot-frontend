import { useEffect, useState } from "react";
import { Crown, Trash2, UserPlus } from "lucide-react";
import Button from "../ui/Button";
import Pill from "../ui/Pill";
import { api, ApiError } from "../../lib/api";

interface AccessUser {
  user_id: string;
  email: string;
  full_name: string | null;
  access: "edit" | "view";
  granted_at: string;
}

interface AccessOwner {
  user_id: string;
  email: string;
  full_name: string | null;
}

interface AccessListResponse {
  owner: AccessOwner;
  grants: AccessUser[];
}

interface AccessListProps {
  videoId: number;
  canManage: boolean;
}

const initialsFor = (full: string | null, email: string) => {
  if (full && full.trim()) {
    const parts = full.trim().split(/\s+/);
    return (parts[0][0] + (parts[1]?.[0] ?? "")).toUpperCase();
  }
  return (email[0] ?? "?").toUpperCase();
};

const AccessList = ({ videoId, canManage }: AccessListProps) => {
  const [data, setData] = useState<AccessListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [level, setLevel] = useState<"edit" | "view">("edit");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api<AccessListResponse>(
        `/api/v1/videos/${videoId}/access`
      );
      setData(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Couldn't load people.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  const handleGrant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    setAddError(null);
    try {
      await api(`/api/v1/videos/${videoId}/access`, {
        method: "POST",
        body: { email: email.trim(), access: level },
      });
      setEmail("");
      await load();
    } catch (err) {
      setAddError(err instanceof ApiError ? err.detail : "Failed to grant.");
    } finally {
      setAdding(false);
    }
  };

  const handleRevoke = async (userId: string) => {
    if (!confirm("Remove this person's access?")) return;
    try {
      await api(`/api/v1/videos/${videoId}/access/${userId}`, {
        method: "DELETE",
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Failed to revoke.");
    }
  };

  const handleChangeLevel = async (
    user: AccessUser,
    next: "edit" | "view"
  ) => {
    try {
      await api(`/api/v1/videos/${videoId}/access`, {
        method: "POST",
        body: { email: user.email, access: next },
      });
      await load();
    } catch (err) {
      alert(err instanceof ApiError ? err.detail : "Failed to update.");
    }
  };

  if (loading) {
    return <div className="text-[12px] text-t5">Loading people…</div>;
  }
  if (error) {
    return <div className="font-mono text-[10px] text-err-fg">{error}</div>;
  }
  if (!data) return null;

  return (
    <div className="flex flex-col gap-3">
      {canManage && (
        <form
          onSubmit={handleGrant}
          className="flex items-end gap-2"
        >
          <div className="flex-1">
            <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-1.5">
              Add by email
            </div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="teammate@example.com"
              className="w-full bg-s2 border border-l1 rounded-sm px-2.5 py-1.5 text-[12px] text-t1 outline-none focus:border-l3"
            />
          </div>
          <select
            value={level}
            onChange={(e) => setLevel(e.target.value as "edit" | "view")}
            className="bg-s2 border border-l1 rounded-sm px-2 py-1.5 text-[11px] text-t1 outline-none focus:border-l3"
          >
            <option value="edit">Editor</option>
            <option value="view">Viewer</option>
          </select>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={adding}
          >
            <UserPlus size={12} />
            {adding ? "…" : "Add"}
          </Button>
        </form>
      )}

      {addError && (
        <p className="font-mono text-[10px] text-err-fg">{addError}</p>
      )}

      <div className="flex flex-col">
        {/* Owner row */}
        <div className="flex items-center gap-3 py-2 border-b border-l1">
          <div className="w-7 h-7 rounded-full bg-s3 border border-l2 flex items-center justify-center font-mono text-[10px] font-medium text-t2 flex-shrink-0">
            {initialsFor(data.owner.full_name, data.owner.email)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] text-t1 truncate">
              {data.owner.full_name ?? data.owner.email}
            </div>
            {data.owner.full_name && (
              <div className="font-mono text-[10px] text-t5 truncate">
                {data.owner.email}
              </div>
            )}
          </div>
          <Pill variant="yellow">
            <span className="inline-flex items-center gap-1">
              <Crown size={9} /> Owner
            </span>
          </Pill>
        </div>

        {/* Grants */}
        {data.grants.length === 0 ? (
          <div className="py-3 text-[11px] text-t5 italic">
            No other people have access yet.
          </div>
        ) : (
          data.grants.map((g, i) => (
            <div
              key={g.user_id}
              className={[
                "flex items-center gap-3 py-2",
                i < data.grants.length - 1 ? "border-b border-l1" : "",
              ].join(" ")}
            >
              <div className="w-7 h-7 rounded-full bg-s3 border border-l2 flex items-center justify-center font-mono text-[10px] font-medium text-t2 flex-shrink-0">
                {initialsFor(g.full_name, g.email)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12px] text-t1 truncate">
                  {g.full_name ?? g.email}
                </div>
                {g.full_name && (
                  <div className="font-mono text-[10px] text-t5 truncate">
                    {g.email}
                  </div>
                )}
              </div>
              {canManage ? (
                <>
                  <select
                    value={g.access}
                    onChange={(e) =>
                      handleChangeLevel(g, e.target.value as "edit" | "view")
                    }
                    className="bg-s2 border border-l1 rounded-sm px-2 py-1 text-[11px] text-t1 outline-none focus:border-l3"
                  >
                    <option value="edit">Editor</option>
                    <option value="view">Viewer</option>
                  </select>
                  <button
                    onClick={() => handleRevoke(g.user_id)}
                    className="w-6 h-6 rounded-xs text-t5 hover:bg-err-bg hover:text-err-fg flex items-center justify-center"
                    title="Remove"
                  >
                    <Trash2 size={12} />
                  </button>
                </>
              ) : (
                <Pill variant={g.access === "edit" ? "info" : "neutral"}>
                  {g.access === "edit" ? "Editor" : "Viewer"}
                </Pill>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AccessList;
