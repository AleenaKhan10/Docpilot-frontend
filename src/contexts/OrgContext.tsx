import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, getActiveOrgId, setActiveOrgId } from "../lib/api";
import type { OrgWithRole } from "../lib/types";
import { useAuth } from "./AuthContext";

interface OrgContextValue {
  orgs: OrgWithRole[];
  activeOrg: OrgWithRole | null;
  loading: boolean;
  switchOrg: (id: string) => void;
  refresh: () => Promise<void>;
}

const Ctx = createContext<OrgContextValue | undefined>(undefined);

export const OrgProvider = ({ children }: { children: ReactNode }) => {
  const { session } = useAuth();
  const [orgs, setOrgs] = useState<OrgWithRole[]>([]);
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(
    getActiveOrgId()
  );
  const [loading, setLoading] = useState(true);

  // Depend on the stable user id, not the session reference. Supabase rebuilds
  // the session object on every TOKEN_REFRESHED (which fires on tab focus),
  // and re-fetching orgs every time the tab regains focus is what makes the
  // UI flash blank.
  const userId = session?.user?.id ?? null;

  const refresh = useCallback(async () => {
    if (!userId) {
      setOrgs([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const list = await api<OrgWithRole[]>("/api/v1/orgs/mine", {
        skipOrgHeader: true,
      });
      setOrgs(list);

      // Pick an active org: keep current if still valid, else first.
      const current = getActiveOrgId();
      const stillValid = current && list.some((o) => o.id === current);
      const nextId = stillValid ? current : list[0]?.id ?? null;
      setActiveOrgId(nextId);
      setActiveOrgIdState(nextId);
    } catch {
      setOrgs([]);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const switchOrg = useCallback((id: string) => {
    setActiveOrgId(id);
    setActiveOrgIdState(id);
  }, []);

  const value = useMemo<OrgContextValue>(
    () => ({
      orgs,
      activeOrg: orgs.find((o) => o.id === activeOrgId) ?? null,
      loading,
      switchOrg,
      refresh,
    }),
    [orgs, activeOrgId, loading, switchOrg, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOrg = (): OrgContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used inside <OrgProvider>");
  return ctx;
};
