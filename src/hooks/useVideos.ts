import { useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrg } from "../contexts/OrgContext";
import { api } from "../lib/api";
import { queryKeys } from "../lib/query-client";
import type { BackendVideoDetail, BackendVideoSummary } from "../lib/video-types";

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

/**
 * Returns a callback that warms the cache for a single video's detail.
 * Wired onto hover handlers in document tables — by the time the user
 * clicks through, the detail fetch has either completed or is in flight,
 * so the destination page skips the spinner.
 *
 * prefetchQuery is a no-op when the entry is fresh and silently dedupes
 * concurrent calls, so a user dragging their cursor across many rows
 * only triggers one network call per row.
 */
export const usePrefetchVideo = () => {
  const queryClient = useQueryClient();
  return useCallback(
    (id: number | string) =>
      queryClient.prefetchQuery({
        queryKey: queryKeys.video(Number(id)),
        queryFn: () => api<BackendVideoDetail>(`/api/v1/videos/${id}`),
      }),
    [queryClient]
  );
};
