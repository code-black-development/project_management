import { useState, useEffect } from 'react';

export function usePresignedUrl(s3Key: string | undefined | null) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!s3Key) {
      setPresignedUrl(null);
      return;
    }

    // If it's already a full HTTP URL (legacy), use it directly
    if (s3Key.startsWith('http')) {
      setPresignedUrl(s3Key);
      return;
    }

    // If it's a local path (starts with /), use it directly
    if (s3Key.startsWith('/')) {
      setPresignedUrl(s3Key);
      return;
    }

    // Otherwise, it's an S3 key, generate presigned URL
    setLoading(true);
    setError(null);

    fetch(`/api/s3-image?key=${encodeURIComponent(s3Key)}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to get presigned URL');
        }
        return response.json();
      })
      .then(data => {
        setPresignedUrl(data.url);
      })
      .catch(err => {
        setError(err.message);
        console.error('Error fetching presigned URL:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [s3Key]);

  return { presignedUrl, loading, error };
}
