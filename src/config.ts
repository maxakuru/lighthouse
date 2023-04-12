import { throwableResponse } from './response';

import type { APIGatewayEvent } from 'aws-lambda';
import type { Config, Context, CookieConfig, Request } from './types';

const parseMultiValueHeader = (all: string): Record<string, string> => {
  return Object.fromEntries(all.split(';').map(one => one.trim().split('=')));
}

const parseCookies = (
  url: URL,
  headerVal: string
): CookieConfig[] => {
  const cookies = parseMultiValueHeader(headerVal);
  const spl = url.hostname.split('.');
  const domain = spl.slice(Math.max(spl.length - 3, 0)).join('.');
  return Object.entries(cookies).map(([name, value]) => {
    // console.debug(`[Config] made cookie: domain=${domain} name=${name}`);
    // TODO: make these configurable from the header
    return {
      domain,
      name,
      value,
      sameSite: 'None',
      path: '/',
      httpOnly: true,
      secure: true,
      expires: Math.ceil(Date.now() / 1000 + 30)
    };
  });
}

function resolvePOSTConfig(request: Request, ctx: Context): Config {
  throw Error('not implemented');
}

function assertValidStrategy(strategy?: string | null): asserts strategy is Config['strategy'] {
  if (strategy && !['mobile', 'desktop'].includes(strategy)) {
    throw throwableResponse(400, 'invalid strategy');
  }
}


export default function resolveConfig(request: Request, ctx: Context): Config {
  if (request.method === 'POST') {
    return resolvePOSTConfig(request, ctx);
  }

  const urlString = ctx.url.searchParams.get('url');
  const strategy = ctx.url.searchParams.get('strategy');

  assertValidStrategy(strategy);

  if (!urlString) {
    throw throwableResponse(400, 'missing url parameter');
  }

  let url: URL;
  try {
    url = new URL(urlString);
  } catch {
    throw throwableResponse(400, 'invalid url parameter');
  }

  const config: Config = {
    url,
    strategy,
    cookies: []
  }
  if (request.headers.has('x-set-cookie')) {
    // config.cookies = headers['x-set-cookies'].split(';').map(v => v.trim());
    config.cookies = parseCookies(url, request.headers.get('x-set-cookie') as string);
  }

  return config;
}