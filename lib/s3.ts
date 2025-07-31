import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { v4 as uuidv4 } from "uuid";

// S3 client configuration - AWS SDK will automatically read from env variables
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export interface UploadResult {
  key: string;
  url: string;
}

export async function uploadToS3(
  file: File | Buffer,
  folder: string = "uploads",
  originalName?: string
): Promise<UploadResult> {
  try {
    // Generate unique filename
    const fileExtension = originalName ? originalName.split(".").pop() : "jpg";
    const key = `${folder}/${uuidv4()}.${fileExtension}`;

    // Prepare file buffer
    let buffer: Buffer;
    let contentType: string;

    if (file instanceof File) {
      buffer = Buffer.from(await file.arrayBuffer());
      contentType = file.type || "image/jpeg";
    } else {
      buffer = file;
      contentType = "image/jpeg";
    }

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      // No ACL needed since we'll use presigned URLs
    });

    await s3Client.send(command);

    // Store the S3 key path instead of the full URL
    // We'll generate presigned URLs when needed
    const url = key; // Just store the S3 key

    return {
      key,
      url,
    };
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw new Error("Failed to upload file to S3");
  }
}

export async function getPresignedUrl(
  key: string,
  expiresIn: number = 3600
): Promise<string> {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    const presignedUrl = await getSignedUrl(s3Client, command, { expiresIn });
    return presignedUrl;
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    throw new Error("Failed to generate presigned URL");
  }
}

export async function deleteFromS3(key: string): Promise<void> {
  try {
    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    });

    await s3Client.send(command);
  } catch (error) {
    console.error("Error deleting from S3:", error);
    throw new Error("Failed to delete file from S3");
  }
}

export function extractS3KeyFromUrl(url: string): string | null {
  try {
    // If it's already just a key (new format), return it
    if (!url.startsWith("http")) {
      return url;
    }

    // Extract key from full S3 URL (legacy format)
    const bucketUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/`;
    if (url.startsWith(bucketUrl)) {
      return url.replace(bucketUrl, "");
    }

    // Handle alternative S3 URL format
    const altBucketUrl = `https://s3.${process.env.AWS_REGION}.amazonaws.com/${BUCKET_NAME}/`;
    if (url.startsWith(altBucketUrl)) {
      return url.replace(altBucketUrl, "");
    }

    return null;
  } catch {
    return null;
  }
}
