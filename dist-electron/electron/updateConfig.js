"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BUILTIN_UPDATE_MANIFEST_URL = void 0;
/**
 * URL HTTPS tới file `latest.json`.
 * Mặc định: raw trên GitLab (nhánh main, path docs/update/latest.json).
 *
 * Khi để rỗng: có thể gán `REMINDER_UPDATE_MANIFEST_URL` trên máy dev/CI.
 */
exports.BUILTIN_UPDATE_MANIFEST_URL = 'https://gitlab.fci.vn/hoanghv13/reminder/-/raw/main/docs/update/latest.json';
