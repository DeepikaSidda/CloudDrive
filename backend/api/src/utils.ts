import { ApiResponse } from './types';

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type,Authorization',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
};

export function successResponse(data: any, statusCode = 200): ApiResponse {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  };
}

export function errorResponse(message: string, statusCode = 400): ApiResponse {
  return {
    statusCode,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    body: JSON.stringify({ error: message }),
  };
}

export function getUserIdFromEvent(event: any): string {
  // No authentication - use a default user ID for all users
  return 'default-user';
}

export function validateRequired(obj: any, fields: string[]): string | null {
  for (const field of fields) {
    if (!obj[field]) {
      return `Missing required field: ${field}`;
    }
  }
  return null;
}
