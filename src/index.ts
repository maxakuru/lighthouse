import { wrap } from '@adobe/helix-shared-wrap';
import { bodyData } from '@adobe/helix-shared-body-data';
import { helixStatus } from '@adobe/helix-status';

import { makeResponse, makeErrorResponse } from './response.js';
import resolveConfig from './config.js';
import runLighthouse from './lighthouse.js';
import timeout from './timeout.js';

import type { WrapFunction } from '@adobe/helix-shared-wrap';
import type { Context, Request } from './types';

const TIMEOUT = 30 * 1000;

function setupContext(request: Request, ctx: Partial<Context>): Context {
  const context = ctx as Context;
  context.url = new URL(request.url);
  return context;
}


const run = async (request: Request, ctx: Context) => {
  if (request.method === 'OPTIONS') {
    return makeResponse(200, undefined, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET',
      'access-control-allow-headers': 'x-set-cookie,x-set-headers'
    });
  }

  try {
    const config = resolveConfig(request, ctx);
    const lighthouseResult = await timeout(() => runLighthouse(config), TIMEOUT);
    return makeResponse(200, { lighthouseResult });
  } catch (e) {
    if (e.message === 'timeout') {
      return makeErrorResponse(504, 'timeout');
    }

    if (e.response) {
      return e.response;
    }

    console.error('runtime error: ', e);
    return makeErrorResponse(500, e.message);
  }
}

export const handler = wrap(run)
  .with(bodyData as unknown as WrapFunction)
  .with(helixStatus);
