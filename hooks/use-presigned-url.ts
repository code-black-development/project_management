import { useQuery } from "@tanstack/react-query";

const PRESIGNED_URL_STALE_TIME = 55 * 60 * 1000;

export function usePresignedUrl(s3Key: string | undefined | null) {
  const isDirectUrl =
    !!s3Key && (s3Key.startsWith("http") || s3Key.startsWith("/"));
  const shouldFetch = !!s3Key && !isDirectUrl;

  const query = useQuery({
    queryKey: ["presigned-url", s3Key],
    enabled: shouldFetch,
    staleTime: PRESIGNED_URL_STALE_TIME,
    gcTime: PRESIGNED_URL_STALE_TIME + 5 * 60 * 1000,
    retry: false,
    queryFn: async () => {
      const response = await fetch(
        `/api/s3-image?key=${encodeURIComponent(s3Key!)}`
      );
      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error("Failed to get presigned URL");
      }

      const data = await response.json();
      return data.url as string | null;
    },
  });

  return {
    presignedUrl: isDirectUrl ? s3Key : query.data ?? null,
    loading: shouldFetch ? query.isLoading || query.isFetching : false,
    error: query.error instanceof Error ? query.error.message : null,
  };
}
