import { NextRequest, NextResponse } from "next/server";
import { getPresignedUrl, extractS3KeyFromUrl } from "@/lib/s3";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageKey = searchParams.get("key");

    if (!imageKey) {
      return NextResponse.json(
        { error: "Key parameter is required" },
        { status: 400 }
      );
    }

    // Check if it's already a presigned URL
    if (imageKey.includes("X-Amz-Signature")) {
      return NextResponse.json({ url: imageKey });
    }

    // Extract S3 key if it's a full URL, or use as-is if it's already a key
    const key = extractS3KeyFromUrl(imageKey) || imageKey;

    if (!key) {
      return NextResponse.json({ error: "Invalid S3 key" }, { status: 400 });
    }

    // Generate presigned URL
    const presignedUrl = await getPresignedUrl(key, 3600); // 1 hour expiry

    return NextResponse.json({ url: presignedUrl });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return NextResponse.json(
      { error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
