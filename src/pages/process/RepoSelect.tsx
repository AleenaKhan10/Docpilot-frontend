import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Github, Loader2 } from "lucide-react";
import MainLayout from "../../components/layout/MainLayout";
import Button from "../../components/ui/Button";
import Pill from "../../components/ui/Pill";
import { useOrg } from "../../contexts/OrgContext";
import { api, ApiError, setActiveOrgId } from "../../lib/api";

type Repo = {
  id: number;
  full_name: string;
  name: string;
  owner: string;
  default_branch: string;
  private: boolean;
  description: string | null;
  language: string | null;
  already_connected: boolean;
  source_id: string | null;
};

const RepoSelect = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { activeOrg } = useOrg();

  const installationId = params.get("installation_id");
  const orgFromCallback = params.get("org");

  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [error, setError] = useState<string>("");
  const [connectingRepoId, setConnectingRepoId] = useState<number | null>(null);

  // If the GitHub callback landed on this route with an org param that
  // differs from the currently-active org, switch to the one the install
  // was scoped to. The install-url endpoint signed the org into `state`
  // so this is trustworthy.
  useEffect(() => {
    if (orgFromCallback && activeOrg && orgFromCallback !== activeOrg.id) {
      setActiveOrgId(orgFromCallback);
      // Force a reload so OrgContext picks up the new active org.
      window.location.reload();
    }
  }, [orgFromCallback, activeOrg]);

  useEffect(() => {
    if (!installationId) return;
    let cancelled = false;
    (async () => {
      try {
        const data = await api<Repo[]>(
          `/api/v1/sources/github/repos?installation_id=${installationId}`
        );
        if (!cancelled) setRepos(data);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.detail : "Failed to load repos.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [installationId]);

  const onConnect = async (r: Repo) => {
    setConnectingRepoId(r.id);
    setError("");
    try {
      const resp = await api<{ source_id: string; repo_full_name: string }>(
        "/api/v1/sources/github/connect",
        {
          method: "POST",
          body: {
            installation_id: Number(installationId),
            repo_id: r.id,
            repo_full_name: r.full_name,
            default_branch: r.default_branch,
          },
        }
      );
      navigate(`/process/repo/${resp.source_id}`);
    } catch (e) {
      setError(e instanceof ApiError ? e.detail : "Failed to connect.");
      setConnectingRepoId(null);
    }
  };

  // Direct navigation without an installation_id can't do anything useful
  // — the real entry point for "manage my repos" is /process/repo. Bounce
  // the user there so they don't see a dead error page.
  useEffect(() => {
    if (!installationId) navigate("/process/repo", { replace: true });
  }, [installationId, navigate]);

  if (!installationId) return null;

  return (
    <MainLayout
      breadcrumbs={[
        { label: activeOrg?.name ?? "Workspace" },
        { label: "Connect repo" },
      ]}
    >
      <div className="px-6 py-6 max-w-[900px] mx-auto">
        <div className="mb-6 flex items-start gap-3">
          <div className="w-9 h-9 bg-s2 border border-l2 rounded-md flex items-center justify-center flex-shrink-0">
            <Github size={18} className="text-t2" />
          </div>
          <div>
            <h1 className="font-serif font-normal text-[38px] tracking-tight text-t1 leading-[1.05] mb-2">
              Pick a repository
            </h1>
            <p className="font-serif italic text-[16px] text-t3 leading-relaxed max-w-[52ch]">
              Docpilot has access to these repos through your GitHub App install.
              Pick one to connect and generate docs from.
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-sm border border-err-line bg-err-bg/40 px-3.5 py-2.5 font-mono text-[10px] text-err-fg">
            {error}
          </div>
        )}

        {repos === null && !error && (
          <div className="flex items-center gap-2 text-[12px] text-t4">
            <Loader2 size={14} className="animate-spin" /> Loading repositories…
          </div>
        )}

        {repos && repos.length === 0 && (
          <div className="rounded-md border border-l1 bg-s1 p-6 text-center">
            <div className="text-[13px] font-semibold text-t1 mb-1">
              No repositories accessible
            </div>
            <div className="text-[11px] text-t4">
              The GitHub App install has no repo access. Grant repos on
              github.com and reload.
            </div>
          </div>
        )}

        {repos && repos.length > 0 && (
          <div className="bg-s1 border border-l1 rounded-md divide-y divide-l1">
            {repos.map((r) => {
              const busy = connectingRepoId === r.id;
              return (
                <div
                  key={r.id}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-[13px] font-semibold text-t1 truncate">
                        {r.full_name}
                      </div>
                      {r.private && <Pill variant="neutral">private</Pill>}
                      {r.language && <Pill variant="neutral">{r.language}</Pill>}
                    </div>
                    {r.description && (
                      <div className="text-[11px] text-t4 mt-0.5 truncate">
                        {r.description}
                      </div>
                    )}
                  </div>
                  {r.already_connected && r.source_id ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => navigate(`/process/repo/${r.source_id}`)}
                    >
                      <Check size={12} className="text-ok-fg mr-1" /> Open
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={busy || connectingRepoId !== null}
                      onClick={() => onConnect(r)}
                    >
                      {busy ? "Connecting…" : "Connect"}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default RepoSelect;
