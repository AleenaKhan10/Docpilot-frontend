import { useEffect, useState } from "react";
import { Check, Copy, Globe2, Link2, RotateCw, Trash2, Users, X } from "lucide-react";
import Button from "../ui/Button";
import Pill from "../ui/Pill";
import AccessList from "./AccessList";
import { api, ApiError } from "../../lib/api";

interface ShareInfo {
  token: string;
  url: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
}

interface ShareDialogProps {
  videoId: number;
  /** Whether the caller can manage sharing (doc owner or org owner). */
  canManageSharing: boolean;
  open: boolean;
  onClose: () => void;
}

const EXPIRY_OPTIONS = [
  { value: 0, label: "Never expires" },
  { value: 7, label: "7 days" },
  { value: 30, label: "30 days" },
  { value: 90, label: "90 days" },
];

const ShareDialog = ({
  videoId,
  canManageSharing,
  open,
  onClose,
}: ShareDialogProps) => {
  const [tab, setTab] = useState<"people" | "link">("people");
  const [info, setInfo] = useState<ShareInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiryDays, setExpiryDays] = useState<number>(0);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    api<ShareInfo | null>(`/api/v1/videos/${videoId}/share`)
      .then(setInfo)
      .catch((e) =>
        setError(e instanceof ApiError ? e.detail : "Couldn't load share status.")
      )
      .finally(() => setLoading(false));
  }, [open, videoId]);

  const createOrRefresh = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await api<ShareInfo>(`/api/v1/videos/${videoId}/share`, {
        method: "POST",
        body: { expires_in_days: expiryDays || null },
      });
      setInfo(res);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Failed to create share link.");
    } finally {
      setBusy(false);
    }
  };

  const disable = async () => {
    if (!confirm("Disable the share link? Anyone using it will lose access.")) return;
    setBusy(true);
    setError(null);
    try {
      await api(`/api/v1/videos/${videoId}/share`, { method: "DELETE" });
      setInfo(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Failed to disable.");
    } finally {
      setBusy(false);
    }
  };

  const copy = () => {
    if (!info) return;
    navigator.clipboard.writeText(info.url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };

  if (!open) return null;

  const expiresHuman = info?.expires_at
    ? new Date(info.expires_at).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className="fixed inset-0 z-50 bg-bg/70 backdrop-blur-sm flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-s1 border border-l3 rounded-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-l1 px-5 py-3">
          <div className="text-[13px] font-semibold text-t1">Share document</div>
          <button
            onClick={onClose}
            className="w-6 h-6 rounded-xs text-t5 hover:bg-s2 hover:text-t2 flex items-center justify-center"
          >
            <X size={13} />
          </button>
        </div>

        {/* Tab bar */}
        <div className="flex border-b border-l1 px-2">
          {[
            { id: "people" as const, label: "People", icon: <Users size={12} /> },
            { id: "link" as const, label: "Public link", icon: <Globe2 size={12} /> },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={[
                "px-3 py-2 text-[12px] flex items-center gap-1.5 border-b-2 -mb-px transition",
                tab === t.id
                  ? "border-white text-t1"
                  : "border-transparent text-t4 hover:text-t2",
              ].join(" ")}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {tab === "people" && (
          <div className="px-5 py-4">
            <AccessList videoId={videoId} canManage={canManageSharing} />
          </div>
        )}

        {tab === "link" && (
        <div className="px-5 py-4 flex flex-col gap-4">
          {loading ? (
            <div className="text-[12px] text-t5">Loading…</div>
          ) : error ? (
            <div className="font-mono text-[10px] text-err-fg">{error}</div>
          ) : info ? (
            <>
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-2">
                  Public link
                </div>
                <div className="flex items-stretch gap-1">
                  <div className="flex-1 bg-s2 border border-l1 rounded-sm px-3 py-2 font-mono text-[11px] text-t2 truncate">
                    {info.url}
                  </div>
                  <button
                    onClick={copy}
                    className="px-3 rounded-sm border border-l2 text-t3 hover:bg-s2 hover:text-t1 hover:border-l3 transition flex items-center gap-1.5"
                  >
                    {copied ? (
                      <>
                        <Check size={12} className="text-ok-fg" />
                        <span className="text-[11px]">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={12} />
                        <span className="text-[11px]">Copy</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Pill variant={info.is_active ? "ok" : "neutral"}>
                    {info.is_active ? "Active" : "Disabled"}
                  </Pill>
                  <span className="font-mono text-[10px] text-t5">
                    {expiresHuman ? `Expires ${expiresHuman}` : "Never expires"}
                  </span>
                </div>
              </div>

              {canManageSharing && (
                <div className="flex items-center gap-1.5 pt-2 border-t border-l1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={createOrRefresh}
                    disabled={busy}
                  >
                    <RotateCw size={12} />
                    {busy ? "Working…" : "Regenerate link"}
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={disable}
                    disabled={busy}
                  >
                    <Trash2 size={12} />
                    Disable
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-[12px] text-t4 leading-relaxed">
                Anyone with the link can view this document (read-only).
                No DocPilot account needed.
              </p>
              {canManageSharing && (
                <>
                  <div>
                    <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-t5 mb-2">
                      Expiry
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {EXPIRY_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setExpiryDays(opt.value)}
                          className={[
                            "font-mono text-[9px] font-medium uppercase tracking-wide px-2 py-1 rounded-xs border transition",
                            expiryDays === opt.value
                              ? "bg-s3 border-l3 text-t1"
                              : "bg-transparent border-l1 text-t5 hover:border-l2 hover:text-t3",
                          ].join(" ")}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    size="md"
                    onClick={createOrRefresh}
                    disabled={busy}
                    className="self-start"
                  >
                    <Link2 size={13} />
                    {busy ? "Creating…" : "Create share link"}
                  </Button>
                </>
              )}
              {!canManageSharing && (
                <p className="font-mono text-[10px] text-t5">
                  Only the document owner or org owner can create a share link.
                </p>
              )}
            </>
          )}
        </div>
        )}
      </div>
    </div>
  );
};

export default ShareDialog;
