import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api, getActiveOrgId, setActiveOrgId } from "../lib/api";
import { queryKeys } from "../lib/query-client";
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
  const queryClient = useQueryClient();
  const [activeOrgId, setActiveOrgIdState] = useState<string | null>(
    getActiveOrgId()
  );

  // Stable user id so we re-query only on real auth changes — not on every
  // silent TOKEN_REFRESHED event Supabase fires when the tab regains focus.
  const userId = session?.user?.id ?? null;

  const {
    data: orgs = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: [...queryKeys.myOrgs, userId],
    queryFn: () =>
      api<OrgWithRole[]>("/api/v1/orgs/mine", { skipOrgHeader: true }),
    enabled: Boolean(userId),
    // Org membership rarely changes; safe to consider it fresh for 2 min
    // and reuse the cache across pages. Mutations (create org, switch org)
    // explicitly invalidate.
    staleTime: 2 * 60_000,
  });

  // Keep activeOrgId pinned to a valid entry: prefer the existing pick,
  // otherwise the first org we know about. Persist to localStorage so the
  // choice survives reloads.
  useEffect(() => {
    if (!orgs.length) {
      if (activeOrgId !== null) {
        setActiveOrgId(null);
        setActiveOrgIdState(null);
      }
      return;
    }
    const stillValid = activeOrgId && orgs.some((o) => o.id === activeOrgId);
    const nextId = stillValid ? activeOrgId : orgs[0].id;
    if (nextId !== activeOrgId) {
      setActiveOrgId(nextId);
      setActiveOrgIdState(nextId);
    }
  }, [orgs, activeOrgId]);

  // Logged out → drop any cached orgs so a re-login starts clean.
  useEffect(() => {
    if (!userId) {
      queryClient.removeQueries({ queryKey: queryKeys.myOrgs });
      setActiveOrgId(null);
      setActiveOrgIdState(null);
    }
  }, [userId, queryClient]);

  const switchOrg = useCallback((id: string) => {
    setActiveOrgId(id);
    setActiveOrgIdState(id);
  }, []);

  const refresh = useCallback(async () => {
    await refetch();
  }, [refetch]);

  const value = useMemo<OrgContextValue>(
    () => ({
      orgs,
      activeOrg: orgs.find((o) => o.id === activeOrgId) ?? null,
      // Only report loading on the *initial* fetch. Background revalidations
      // keep the prior data visible — that's the whole point of the cache.
      loading: isLoading && orgs.length === 0,
      switchOrg,
      refresh,
    }),
    [orgs, activeOrgId, isLoading, switchOrg, refresh]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useOrg = (): OrgContextValue => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useOrg must be used inside <OrgProvider>");
  return ctx;
};
