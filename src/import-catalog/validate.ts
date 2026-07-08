import type {
  LocationImport,
  PhotographerImport,
  ValidationResult,
} from "./types";

const PHOTOGRAPHER_KEYS = new Set([
  "name",
  "email",
  "description",
  "instagram",
  "facebook",
  "twitter",
  "website",
  "portfolio",
]);

const LOCATION_KEYS = new Set([
  "name",
  "description",
  "address",
  "latitude",
  "longitude",
  "previewGallery",
]);

const MAX_NAME = 255;
const MAX_SOCIAL = 512;
const MAX_ADDRESS = 512;

const GALLERY_EXT = /\.(jpe?g|png)$/i;

export function isAllowedGalleryFilename(filename: string): boolean {
  if (!filename || filename.includes("/") || filename.includes("\\")) {
    return false;
  }
  if (/^https?:\/\//i.test(filename)) {
    return false;
  }
  return GALLERY_EXT.test(filename);
}

export function validatePhotographerJson(
  raw: unknown,
): ValidationResult<PhotographerImport> {
  if (!isRecord(raw)) {
    return { ok: false, error: "JSON must be an object" };
  }

  for (const key of Object.keys(raw)) {
    if (!PHOTOGRAPHER_KEYS.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  const name = requireString(raw.name, "name", MAX_NAME);
  if (!name.ok) return name;

  const email = requireString(raw.email, "email", MAX_NAME);
  if (!email.ok) return email;

  const description = optionalString(raw.description, "description");
  if (!description.ok) return description;

  const instagram = optionalString(raw.instagram, "instagram", MAX_SOCIAL);
  if (!instagram.ok) return instagram;

  const facebook = optionalString(raw.facebook, "facebook", MAX_SOCIAL);
  if (!facebook.ok) return facebook;

  const twitter = optionalString(raw.twitter, "twitter", MAX_SOCIAL);
  if (!twitter.ok) return twitter;

  const website = optionalString(raw.website, "website", MAX_SOCIAL);
  if (!website.ok) return website;

  const portfolio = optionalGalleryArray(raw.portfolio, "portfolio");
  if (!portfolio.ok) return portfolio;

  return {
    ok: true,
    value: {
      name: name.value,
      email: email.value,
      ...(description.value !== undefined && { description: description.value }),
      ...(instagram.value !== undefined && { instagram: instagram.value }),
      ...(facebook.value !== undefined && { facebook: facebook.value }),
      ...(twitter.value !== undefined && { twitter: twitter.value }),
      ...(website.value !== undefined && { website: website.value }),
      ...(portfolio.value !== undefined && { portfolio: portfolio.value }),
    },
  };
}

export function validateLocationJson(
  raw: unknown,
): ValidationResult<LocationImport> {
  if (!isRecord(raw)) {
    return { ok: false, error: "JSON must be an object" };
  }

  for (const key of Object.keys(raw)) {
    if (!LOCATION_KEYS.has(key)) {
      return { ok: false, error: `Unknown field: ${key}` };
    }
  }

  const name = requireString(raw.name, "name", MAX_NAME);
  if (!name.ok) return name;

  const description = optionalString(raw.description, "description");
  if (!description.ok) return description;

  const address = optionalString(raw.address, "address", MAX_ADDRESS);
  if (!address.ok) return address;

  const latitude = optionalNumber(raw.latitude, "latitude");
  if (!latitude.ok) return latitude;

  const longitude = optionalNumber(raw.longitude, "longitude");
  if (!longitude.ok) return longitude;

  const previewGallery = optionalGalleryArray(
    raw.previewGallery,
    "previewGallery",
  );
  if (!previewGallery.ok) return previewGallery;

  return {
    ok: true,
    value: {
      name: name.value,
      ...(description.value !== undefined && { description: description.value }),
      ...(address.value !== undefined && { address: address.value }),
      ...(latitude.value !== undefined && { latitude: latitude.value }),
      ...(longitude.value !== undefined && { longitude: longitude.value }),
      ...(previewGallery.value !== undefined && {
        previewGallery: previewGallery.value,
      }),
    },
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function requireString(
  value: unknown,
  field: string,
  maxLength: number,
): ValidationResult<string> {
  if (typeof value !== "string" || value.trim() === "") {
    return { ok: false, error: `${field} is required` };
  }
  if (value.length > maxLength) {
    return { ok: false, error: `${field} exceeds max length ${maxLength}` };
  }
  return { ok: true, value };
}

function optionalString(
  value: unknown,
  field: string,
  maxLength = Number.MAX_SAFE_INTEGER,
): ValidationResult<string | undefined> {
  if (value === undefined || value === null) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "string") {
    return { ok: false, error: `${field} must be a string` };
  }
  if (value.length > maxLength) {
    return { ok: false, error: `${field} exceeds max length ${maxLength}` };
  }
  return { ok: true, value };
}

function optionalNumber(
  value: unknown,
  field: string,
): ValidationResult<number | undefined> {
  if (value === undefined || value === null) {
    return { ok: true, value: undefined };
  }
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { ok: false, error: `${field} must be a number` };
  }
  return { ok: true, value };
}

function optionalGalleryArray(
  value: unknown,
  field: string,
): ValidationResult<string[] | undefined> {
  if (value === undefined || value === null) {
    return { ok: true, value: undefined };
  }
  if (!Array.isArray(value)) {
    return { ok: false, error: `${field} must be an array` };
  }
  for (const item of value) {
    if (typeof item !== "string" || !isAllowedGalleryFilename(item)) {
      return {
        ok: false,
        error: `${field} entries must be local .jpg, .jpeg, or .png filenames`,
      };
    }
  }
  return { ok: true, value: value };
}
