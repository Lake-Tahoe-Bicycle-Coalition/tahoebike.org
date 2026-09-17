import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/admin/auth";
import { blobConfigured, IMAGE_CONTENT_TYPES, MAX_IMAGE_BYTES, UPLOAD_PATH_PREFIX } from "@/lib/admin/blob";

/**
 * Token endpoint for browser-to-Blob image uploads (components/admin/image-field.tsx).
 * The browser asks here for a short-lived client token, then PUTs the file to Blob
 * directly, so uploads are not subject to the 4.5 MB request limit of a Vercel function.
 *
 * Only signed-in admins get a token, and a token only allows an image of at most
 * MAX_IMAGE_BYTES under `uploads/`. Blob's completion callback is not used: the browser
 * receives the final URL from the upload itself and stores it in the form field.
 */
export async function POST(request: Request): Promise<NextResponse> {
  const admin = await getAdmin();
  if (!admin) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  if (!blobConfigured) {
    return NextResponse.json({ error: "Image uploads are not configured (BLOB_READ_WRITE_TOKEN)." }, { status: 503 });
  }

  let body: HandleUploadBody;
  try {
    body = (await request.json()) as HandleUploadBody;
  } catch {
    return NextResponse.json({ error: "Malformed request." }, { status: 400 });
  }

  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(UPLOAD_PATH_PREFIX) || pathname.includes("..")) {
          throw new Error(`Uploads must be filed under ${UPLOAD_PATH_PREFIX}`);
        }
        return {
          allowedContentTypes: IMAGE_CONTENT_TYPES,
          maximumSizeInBytes: MAX_IMAGE_BYTES,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ uploadedBy: admin.email }),
        };
      },
    });
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
