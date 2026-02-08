import type { CrudEntityConfig } from "../../types/bukku.js";

/**
 * File Entity Configuration
 *
 * API: /files
 * Response keys: file (singular), files (plural)
 *
 * Files are typically attached to sales and purchase transactions using file_ids arrays.
 * The create operation is handled by a custom upload-file tool (not the factory create tool)
 * because file upload requires multipart/form-data, not JSON.
 *
 * API limitations:
 * - No delete endpoint (files are permanent once uploaded)
 * - No update endpoint (files are immutable)
 * - No pagination support for list (returns ALL files)
 * - No list filters (API spec shows no query parameters)
 */
export const fileConfig: CrudEntityConfig = {
  entity: "file",
  apiBasePath: "/files",
  singularKey: "file",
  pluralKey: "files",
  description:
    "file. Files are typically attached to sales and purchase transactions using file_ids arrays. Use upload-file to add new files.",
  operations: ["list", "get"],
  hasStatusUpdate: false,
  listFilters: [],
};
