import { createLogger } from '../utils/logger.js';
import { readFile } from "node:fs/promises";
import { basename, extname } from "node:path";

const log = createLogger('bukku');

/**
 * Configuration for BukkuClient.
 * Decoupled from MCP-specific environment config.
 */
export interface BukkuClientConfig {
  apiToken: string;
  companySubdomain: string;
}

/**
 * HTTP client for Bukku API.
 * Handles authentication via Bearer token and Company-Subdomain header.
 * Base URL: https://api.bukku.my
 */
export class BukkuClient {
  private readonly baseUrl = "https://api.bukku.my";
  private readonly token: string;
  private readonly subdomain: string;

  constructor(config: BukkuClientConfig) {
    this.token = config.apiToken;
    this.subdomain = config.companySubdomain;
  }

  /**
   * Build headers for all requests.
   * CRITICAL: Never log the actual token value - use "Bearer ***" for debugging.
   */
  private getHeaders(includeContentType = false): HeadersInit {
    const headers: HeadersInit = {
      Authorization: `Bearer ${this.token}`,
      "Company-Subdomain": this.subdomain,
      Accept: "application/json",
    };

    if (includeContentType) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  /**
   * Map file extensions to MIME types for common file types.
   * Returns null for unknown extensions.
   */
  private getMimeType(extension: string): string | null {
    const mimeMap: Record<string, string> = {
      ".pdf": "application/pdf",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".gif": "image/gif",
      ".txt": "text/plain",
      ".csv": "text/csv",
      ".json": "application/json",
      ".xml": "application/xml",
      ".zip": "application/zip",
    };

    return mimeMap[extension.toLowerCase()] || null;
  }

  /**
   * Build URL with query parameters.
   */
  private buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
    const url = new URL(path, this.baseUrl);

    if (params) {
      for (const [key, value] of Object.entries(params)) {
        if (value !== undefined) {
          url.searchParams.append(key, String(value));
        }
      }
    }

    return url.toString();
  }

  /**
   * GET request with optional query parameters.
   */
  async get(path: string, params?: Record<string, string | number | undefined>): Promise<unknown> {
    const url = this.buildUrl(path, params);
    const response = await fetch(url, {
      method: "GET",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw response;
    }

    return response.json();
  }

  /**
   * POST request with JSON body.
   */
  async post(path: string, body: unknown): Promise<unknown> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "POST",
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw response;
    }

    return response.json();
  }

  /**
   * PUT request with JSON body.
   */
  async put(path: string, body: unknown): Promise<unknown> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "PUT",
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw response;
    }

    return response.json();
  }

  /**
   * PATCH request with JSON body (for status updates).
   */
  async patch(path: string, body: unknown): Promise<unknown> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "PATCH",
      headers: this.getHeaders(true),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw response;
    }

    return response.json();
  }

  /**
   * DELETE request.
   */
  async delete(path: string): Promise<void> {
    const url = this.buildUrl(path);
    const response = await fetch(url, {
      method: "DELETE",
      headers: this.getHeaders(),
    });

    if (!response.ok) {
      throw response;
    }
  }

  /**
   * POST multipart/form-data request for file uploads.
   * Reads file from disk and sends as multipart form data.
   * CRITICAL: Does NOT manually set Content-Type - fetch sets it automatically with boundary.
   *
   * @param path - API endpoint path
   * @param filePath - Absolute path to file on disk
   * @returns API response
   */
  async postMultipart(path: string, filePath: string): Promise<unknown> {
    const url = this.buildUrl(path);

    // Read file from disk
    const fileBuffer = await readFile(filePath);
    const fileName = basename(filePath);
    const fileExtension = extname(filePath);

    // Determine MIME type, fallback to generic binary
    const mimeType = this.getMimeType(fileExtension) || "application/octet-stream";

    // Create File object and FormData
    const file = new File([fileBuffer], fileName, { type: mimeType });
    const form = new FormData();
    form.append("file", file);

    // Get auth headers WITHOUT Content-Type (fetch sets it with boundary)
    const headers = this.getHeaders(false);

    const response = await fetch(url, {
      method: "POST",
      headers,
      body: form,
    });

    if (!response.ok) {
      throw response;
    }

    return response.json();
  }

  /**
   * Validate token on startup by making a lightweight API call.
   * Uses GET /contacts with page_size=1 to verify authentication.
   * Exits process if token is invalid (401).
   */
  async validateToken(): Promise<void> {
    try {
      await this.get("/contacts", { page_size: 1 });
      log("Token validated successfully");
    } catch (error) {
      if (error instanceof Response && error.status === 401) {
        log("Authentication Error\n");
        log("The provided BUKKU_API_TOKEN is invalid or expired.\n");
        log("Please check:");
        log("  1. Token is copied correctly (no extra spaces)");
        log("  2. API Access is enabled in Bukku Control Panel -> Integrations");
        log("  3. Token has not been revoked or regenerated\n");
        process.exit(1);
      }

      // For other errors, log and exit
      log("Failed to validate token:", error);
      process.exit(1);
    }
  }
}
