import { Response } from '@adobe/fetch';

export type ErrorWithResponse = Error & { response: Response };

export const makeResponse = (
  status: number,
  body: string | Record<string, unknown> = '',
  headers: Record<string, string> = {}
): Response => {
  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return new Response(body, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      ...headers
    }
  });
}

export const makeErrorResponse = (
  status: number,
  xError: string,
  message?: string
): Response => {
  return new Response(
    message ? { message } : null, {
    status,
    headers: {
      "access-control-allow-origin": "*",
      "content-type": "application/json",
      "x-error": xError
    }
  });
}

export const throwableResponse = (
  statusCode: number,
  xError: string,
  message?: string
): ErrorWithResponse => {
  const error = Error(xError) as ErrorWithResponse;
  error.response = makeErrorResponse(statusCode, xError, message);
  return error;
}