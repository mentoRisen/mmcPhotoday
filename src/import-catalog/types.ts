export type PhotographerImport = {
  name: string;
  email: string;
  description?: string;
  instagram?: string;
  facebook?: string;
  twitter?: string;
  website?: string;
  portfolio?: string[];
};

export type LocationImport = {
  name: string;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  previewGallery?: string[];
};

export type EntityType = "photographers" | "locations";

export type ValidationResult<T> =
  | { ok: true; value: T }
  | { ok: false; error: string };

export type ScannedJsonFile = {
  filePath: string;
  fileName: string;
  raw: unknown;
};

export type ScanResult = {
  files: ScannedJsonFile[];
  collisionErrors: Map<string, string>;
};

export type ImportResultStatus = "created" | "updated" | "skipped" | "failed";

export type ImportResult = {
  entityType: EntityType;
  fileName: string;
  status: ImportResultStatus;
  message?: string;
};
