export type UpdateManifest = {
  version: string;
  notes?: string;
  notesLines?: string[];
  windows?: {
    portableExe?: { url: string; sha256?: string };
  };
};

export type UpdateCheckResult =
  | { status: 'latest'; currentVersion: string; latestVersion: string }
  | { status: 'available'; currentVersion: string; latestVersion: string; manifest: UpdateManifest }
  | { status: 'error'; currentVersion: string; error: string; notConfigured?: boolean };
