// =============================================================================
// SERVER-ONLY. Uses CLOUDINARY_API_SECRET to sign upload params.
// Importing this from a client component will throw at build via `server-only`.
//
// Signing strategy: client gets { cloud_name, api_key, timestamp, folder,
// signature } from /api/upload-signature (which validates the requester
// first), then POSTs the file directly to Cloudinary with those params.
// The api_secret never leaves the server.
// =============================================================================

import "server-only";

import { v2 as cloudinary } from "cloudinary";

function isConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET,
  );
}

export type SignedUpload = {
  cloud_name: string;
  api_key: string;
  timestamp: number;
  folder: string;
  signature: string;
  resource_type: "video";
};

/**
 * Build signed Cloudinary upload params for the given folder. The client
 * uploads to https://api.cloudinary.com/v1_1/<cloud>/video/upload with this
 * payload. Cloudinary verifies the HMAC against api_secret on its side.
 */
export function signUpload(folder: string): SignedUpload {
  if (!isConfigured()) {
    throw new Error(
      "Cloudinary env vars missing: set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME, " +
        "CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env.local",
    );
  }

  const cloud_name = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;
  const api_key = process.env.CLOUDINARY_API_KEY!;
  const api_secret = process.env.CLOUDINARY_API_SECRET!;

  cloudinary.config({ cloud_name, api_key, api_secret });
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    { timestamp, folder },
    api_secret,
  );

  return {
    cloud_name,
    api_key,
    timestamp,
    folder,
    signature,
    resource_type: "video",
  };
}

/**
 * Derive a 480w jpg thumb URL from a Cloudinary video URL. Same pattern as
 * the legacy SPA (_legacy/src/App.jsx:147-149). Idempotent: re-applying does
 * not chain transforms.
 */
export function deriveThumb(secureUrl: string): string {
  return secureUrl
    .replace("/video/upload/", "/video/upload/so_2,w_480,c_fill,q_auto/")
    .replace(/\.[^./?]+(\?.*)?$/, ".jpg$1");
}
