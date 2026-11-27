import { z } from "zod";
import { createLogger } from "core";

const log = createLogger("bukku-mcp");

/**
 * Environment variable schema.
 * Required vars:
 * - BUKKU_API_TOKEN: Bearer token from Bukku API settings
 * - BUKKU_COMPANY_SUBDOMAIN: Company subdomain (e.g., 'mycompany' from mycompany.bukku.my)
 * Optional vars:
 * - BUKKU_READ_ONLY: "true" or "1" registers only the list, get and search tools
 */
const envSchema = z.object({
  BUKKU_API_TOKEN: z.string().min(1, "BUKKU_API_TOKEN is required"),
  BUKKU_COMPANY_SUBDOMAIN: z.string().min(1, "BUKKU_COMPANY_SUBDOMAIN is required"),
  BUKKU_READ_ONLY: z
    .enum(["", "true", "false", "1", "0"], {
      error: 'BUKKU_READ_ONLY must be "true" or "false"',
    })
    .optional()
    .transform((value) => value === "true" || value === "1"),
});

export type Env = z.infer<typeof envSchema>;

/**
 * Validates environment variables on startup.
 * Exits process with code 1 if validation fails.
 * Prints setup checklist to stderr on failure.
 */
export function validateEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    log("Configuration Error\n");
    log("Missing or invalid environment variables:");

    for (const issue of result.error.issues) {
      log(`  - ${issue.path.join(".")}: ${issue.message}`);
    }

    log("\nSetup checklist:");
    log("  1. Go to Bukku web app -> Control Panel -> Integrations");
    log("  2. Turn on API Access and copy the Access Token");
    log("  3. Set BUKKU_API_TOKEN=<your-token>");
    log("  4. Set BUKKU_COMPANY_SUBDOMAIN=<your-subdomain>");
    log("     (e.g., 'mycompany' from mycompany.bukku.my)");
    log("  5. Restart Claude Desktop\n");

    process.exit(1);
  }

  return result.data;
}
