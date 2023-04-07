/**
 * @typedef {{ 
 *  statusCode: number; 
 *  headers: Record<string, string>; 
 *  body: null | string;
 * }} Response
 */

/**
 * @typedef {Error & { response: Response }} ErrorWithResponse
*/


/**
 * @param {number} statusCode 
 * @param {string|object} [body=null] 
 * @param {Record<string, string>} [headers={}]
 * @returns {Response}
 */
export const makeResponse = (statusCode, body = null, headers = {}) => {
  if(body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['content-type'] = 'application/json';
  }
  return {
    statusCode,
    headers,
    body
  }
}

/**
 * @param {number} statusCode 
 * @param {string} xError 
 * @param {string} [message] 
 * @returns {Response}
 */
export const makeErrorResponse = (statusCode, xError, message) => {
  return {
    statusCode,
    headers : {
      "content-type": "application/json",
      "x-error": xError
    },
    body: message ? JSON.stringify({ message }) : null
  }
}

/**
 * @param {number} statusCode 
 * @param {string} xError 
 * @param {string} [message] 
 * @returns {ErrorWithResponse}
 */
export const throwableResponse = (statusCode, xError, message) => {
  const error = Error(xError);
  error.response = makeErrorResponse(statusCode, xError, message);
  return error;
}