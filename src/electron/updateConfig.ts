/**
 * Optional HTTPS URL to legacy manifest (`latest.json`).
 * Keep for backward compatibility. Leave empty to prefer GitHub Releases.
 */
export const BUILTIN_UPDATE_MANIFEST_URL = '';

/**
 * GitHub repository in `owner/repo` format used for release updates.
 * Override on CI/build via `REMINDER_GITHUB_REPO` when needed.
 */
export const BUILTIN_GITHUB_REPO = 'huangtaizia/Reminder';
