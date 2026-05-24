/**
 * Customer-scoped Cloudinary upload helper. Mirrors the pattern in
 * business-client/utils/cloudinaryUpload.ts but for the customer
 * persona — every upload lands under hoizr/{env}/customers/{customerId}/...
 * so a customer's assets stay isolated from host assets.
 *
 * Unlike the host helper we do NOT fire a server-side delete-on-replace
 * mutation: each new upload simply lives alongside the previous one in
 * the customer's folder. Cloudinary admin sweeps orphans during regular
 * cleanup. This is acceptable because customer avatars are tiny and
 * the upload frequency per customer is very low. If that changes,
 * add a customer-server `deleteCustomerCloudinaryAsset` mutation
 * authorised by `ctx.customerId === folder-tenant`.
 */

const CLOUD_NAME =
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "choose-pos";

const APP_ENV = (
  process.env.NEXT_PUBLIC_HOIZR_ENV ?? "dev"
).toLowerCase();
const ENV_SAFE = APP_ENV.replace(/[^a-z0-9_-]/g, "") || "dev";

const IMAGE_PRESET =
  process.env.NEXT_PUBLIC_CLOUDINARY_IMAGE_PRESET ?? "hoizr-uploads";

const sanitiseId = (value: string): string =>
  value.replace(/[^a-zA-Z0-9_-]/g, "");

type UploadCustomerAvatarArgs = {
  customerId: string;
  file: File | Blob;
};

type UploadResult = {
  secureUrl: string;
  publicId: string;
  width?: number;
  height?: number;
};

export const uploadCustomerAvatar = async ({
  customerId,
  file,
}: UploadCustomerAvatarArgs): Promise<UploadResult> => {
  const folderPath = `hoizr/${ENV_SAFE}/customers/${sanitiseId(customerId)}/profile`;
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", IMAGE_PRESET);
  formData.append("folder", folderPath);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;

  const response = await fetch(endpoint, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    let detail = "";
    try {
      const payload = await response.json();
      detail = payload?.error?.message ? `: ${payload.error.message}` : "";
    } catch {
      // ignore body parse failures
    }
    throw new Error(`Cloudinary upload failed (${response.status})${detail}`);
  }

  const json = (await response.json()) as {
    secure_url: string;
    public_id: string;
    width?: number;
    height?: number;
  };

  return {
    secureUrl: json.secure_url,
    publicId: json.public_id,
    width: json.width,
    height: json.height,
  };
};
