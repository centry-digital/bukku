/**
 * HTTP to MCP Error Transformation
 * Converts HTTP error responses into conversational MCP error messages
 */

export interface MCPErrorResponse {
  content: Array<{ type: 'text'; text: string }>;
  isError?: true;
  [key: string]: unknown;
}

export function transformHttpError(
  status: number | null,
  body: unknown,
  operation: string
): MCPErrorResponse {
  // Handle authentication errors (401)
  if (status === 401) {
    return {
      content: [
        {
          type: 'text',
          text: `Bukku authentication failed for "${operation}". The BUKKU_API_TOKEN environment variable is either missing or invalid. Please check your token and restart the server with the correct credentials.`,
        },
      ],
    };
  }

  // Handle permission errors (403)
  if (status === 403) {
    return {
      content: [
        {
          type: 'text',
          text: `You don't have permission to "${operation}". Please check your Bukku account permissions and ensure you have access to this resource.`,
        },
      ],
    };
  }

  // Handle not found errors (404)
  if (status === 404) {
    return {
      content: [
        {
          type: 'text',
          text: `I couldn't find that item when trying to "${operation}". Try listing the available items first to see what's accessible.`,
        },
      ],
    };
  }

  // Handle validation errors (400, 422)
  if (status === 400 || status === 422) {
    const parsedBody = body as Record<string, unknown>;
    const errors = parsedBody?.errors as Record<string, string[]> | undefined;

    if (errors && typeof errors === 'object') {
      // Multiple validation errors - show all at once
      const errorMessages = Object.entries(errors)
        .map(([field, messages]) => `  - ${field}: ${messages.join(', ')}`)
        .join('\n');

      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `Validation failed for "${operation}":\n${errorMessages}\n\nPlease fix these issues and try again.`,
          },
        ],
      };
    } else {
      // Single error message
      const message = parsedBody?.message || 'Invalid request';
      return {
        isError: true,
        content: [
          {
            type: 'text',
            text: `${message} when trying to "${operation}". Please check your input and try again.`,
          },
        ],
      };
    }
  }

  // Handle service unavailable (503)
  if (status === 503) {
    return {
      content: [
        {
          type: 'text',
          text: `Bukku is temporarily unavailable while trying to "${operation}". Please try again in a few moments.`,
        },
      ],
    };
  }

  // Handle server errors (500+)
  if (status !== null && status >= 500) {
    return {
      content: [
        {
          type: 'text',
          text: `An unexpected error occurred on Bukku's servers while trying to "${operation}". Please try again, and if the issue persists, contact Bukku support.`,
        },
      ],
    };
  }

  // Fallback for unknown status codes
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `An error occurred while trying to "${operation}". Please check your request and try again.`,
      },
    ],
  };
}

export function transformNetworkError(
  error: unknown,
  operation: string
): MCPErrorResponse {
  // Check if it's a network-related error
  const errorMessage = error instanceof Error ? error.message : String(error);

  if (
    errorMessage.includes('fetch') ||
    errorMessage.includes('connect') ||
    errorMessage.includes('network') ||
    error instanceof TypeError
  ) {
    return {
      content: [
        {
          type: 'text',
          text: `Couldn't connect to Bukku while trying to "${operation}". Please check your internet connection and ensure the Bukku API is accessible.`,
        },
      ],
    };
  }

  // Fallback for unknown errors
  return {
    isError: true,
    content: [
      {
        type: 'text',
        text: `An unexpected error occurred while trying to "${operation}": ${errorMessage}. Please try again.`,
      },
    ],
  };
}
