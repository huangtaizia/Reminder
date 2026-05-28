"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_GITHUB_REPO = exports.BUILTIN_UPDATE_MANIFEST_URL = void 0;
/**
 * Optional HTTPS URL to legacy manifest (`latest.json`).
 * Keep for backward compatibility. Leave empty to prefer GitHub Releases.
 */
exports.BUILTIN_UPDATE_MANIFEST_URL = '';
/**
 * GitHub repository in `owner/repo` format used for release updates.
 * Override on CI/build via `REMINDER_GITHUB_REPO` when needed.
 */
exports.BUILTIN_GITHUB_REPO = 'huangtaizia/Reminder';
