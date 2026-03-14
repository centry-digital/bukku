/**
 * Core Bukku API Type Definitions
 *
 * Hand-crafted from OpenAPI specs in .api-specs/
 * These types define the common patterns used across all Bukku API endpoints:
 * - Pagination response structure
 * - Error response format
 * - List query parameters
 * - CRUD entity configuration for the factory pattern
 */

/**
 * Pagination metadata returned by Bukku list endpoints
 * Derived from resPaging schema in sales.yaml
 */
export interface BukkuPaging {
  current_page: number;
  per_page: number;
  total: number;
}

/**
 * Paginated list response wrapper
 * All list endpoints return { paging: {...}, [pluralKey]: [...] }
 * e.g., { paging: {...}, transactions: [...] }
 */
export interface BukkuPaginatedResponse<T> {
  paging: BukkuPaging;
  [key: string]: T[] | BukkuPaging;
}

/**
 * Single item response wrapper
 * All get/create/update endpoints return { [singularKey]: {...} }
 * e.g., { transaction: {...} }
 */
export interface BukkuSingleResponse<T> {
  [key: string]: T;
}

/**
 * Error response structure
 * Derived from general-error.yaml pattern
 * - message: Human-readable error message
 * - errors: Optional validation errors (field -> error messages[])
 */
export interface BukkuErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
}

/**
 * Common list query parameters shared across all list endpoints
 * Derived from parameters/query/* in OpenAPI specs
 */
export interface BukkuListParams {
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_dir?: 'asc' | 'desc';
  search?: string;
  date_from?: string;  // YYYY-MM-DD
  date_to?: string;    // YYYY-MM-DD
  status?: string;
}

/**
 * CRUD operations supported by the factory pattern
 */
export type CrudOperation = 'list' | 'get' | 'create' | 'update' | 'delete';

/**
 * Entity configuration for the CRUD factory pattern
 * Defines all the metadata needed to generate MCP tools for a Bukku entity
 */
export interface CrudEntityConfig {
  /** Entity identifier (e.g., "sales-invoice") */
  entity: string;

  /** API base path (e.g., "/sales/invoices") */
  apiBasePath: string;

  /** Response wrapper key for single item (e.g., "transaction") */
  singularKey: string;

  /** Response wrapper key for list items (e.g., "transactions") */
  pluralKey: string;

  /** Human-readable description for tool metadata (e.g., "sales invoice") */
  description: string;

  /** Which CRUD operations this entity supports */
  operations: CrudOperation[];

  /** Whether this entity supports status updates (e.g., draft -> posted) */
  hasStatusUpdate?: boolean;

  /** Additional list filter parameters beyond the common ones */
  listFilters?: string[];

  /** Optional business-rule context surfaced in tool descriptions to guide LLM behavior */
  businessRules?: {
    /** Constraints on when delete is allowed and what to do instead (appended to delete tool description) */
    delete?: string;
    /** Valid status transitions and lifecycle rules (appended to update-status tool description) */
    statusTransitions?: string;
  };

  /** CLI command group (e.g., 'sales', 'purchases', 'banking') */
  cliGroup?: string;
}
