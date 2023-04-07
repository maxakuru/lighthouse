import resolveConfig from './lib/config.js';
import runLighthouse from './lib/lighthouse.js';
import { makeResponse, makeErrorResponse } from './lib/response.js';
import timeout from './lib/timeout.js';

const TIMEOUT = 30 * 1000;

/**
 * @type {import('aws-lambda').Handler<import('aws-lambda').APIGatewayEvent>}
 */
export const handler = async (event) => {
  try {
    const config = resolveConfig(event);
    const lighthouseResult = await timeout(() => runLighthouse(config), TIMEOUT);
    return makeResponse(200, { lighthouseResult });
  } catch(e) {
    if(e.message === 'timeout') {
      return makeErrorResponse(504, 'timeout');
    }

    if(e.response) {
      return e.response;
    }

    console.error('runtime error: ', e);
    return makeErrorResponse(500, e.message);
  }
}