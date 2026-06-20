import { QueryClient } from "@tanstack/react-query";

/**
 * App-wide QueryClient. Defaults are tuned for an internal-facing SaaS:
 * data is read often but changes rarely.
 *
 * - staleTime: 30s. Cached entries are returned instantly to a new
 *   observer for 30 seconds before being considered stale and
 *   revalidated in the background. This is what makes navigating
 *   between Dashboard and All Documents feel instant — both subscribe
 *   to the same video list cache.
 * - gcTime: 5m. Once a query has no observers, keep the cache for five
 *   minutes so route-switching round-trips stay free.
 * - refetchOnWindowFocus: revalidate when the user returns to the tab,
 *   so a doc someone else just edited shows up without a manual reload.
 * - retry: one retry on failure. The api() helper already throws
 *   typed ApiError on 4xx, and we don't want to hammer the backend.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: 1,
    },
    mutations: {
      retry: 0,
    },
  },
});

/**
 * Canonical query keys. Centralised so a mutation that changes members
 * can invalidate `queryKeys.members(orgId)` without each call site
 * inventing its own string.
 */
export const queryKeys = {
  myOrgs: ["orgs", "mine"] as const,
  members: (orgId: string) => ["orgs", orgId, "members"] as const,
  invitations: (orgId: string) => ["orgs", orgId, "invitations"] as const,
  videos: (orgId: string) => ["videos", orgId] as const,
  video: (id: number) => ["videos", "detail", id] as const,
};
