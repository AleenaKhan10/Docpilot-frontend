import { useQuery } from "@tanstack/react-query";
import { useOrg } from "../contexts/OrgContext";
import { api } from "../lib/api";
import { queryKeys } from "../lib/query-client";
import type { BackendVideoSummary } from "../lib/video-types";

/**
 * Shared video list query. Dashboard and AllDocuments both subscribe to
 * this — same orgId, same cache key — so navigating between the two
 * pages renders instantly from cache while a background revalidation
 * runs.
 *
 * Returns an empty array (not undefined) for `videos` so call sites
 * don't need defensive `?? []` everywhere.
 */
export const useVideos = () => {
  const { activeOrg } = useOrg();
  const orgId = activeOrg?.id;

  const query = useQuery({
    queryKey: orgId ? queryKeys.videos(orgId) : ["videos", "none"],
    queryFn: () => api<BackendVideoSummary[]>("/api/v1/videos/"),
    enabled: Boolean(orgId),
  });

  return {
    videos: query.data ?? [],
    isLoading: query.isLoading,
    isInitialLoading: query.isLoading && !query.data,
    error: query.error,
    refetch: query.refetch,
  };
};
