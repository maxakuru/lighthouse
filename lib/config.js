import { throwableResponse } from "./response.js";

/**
 * @typedef {{
 *  strategy?: 'mobile' | 'desktop';
 *  url: URL;
 *  headers: Record<string, string>;
 *  cookies: Record<string, string|string[]>;
 * }} Config
 */

const parseMultiValueHeader = (all) => {
  return Object.fromEntries(all.split(';').map(one => one.trim().split('=')));
}

/**
 * @param {URL} url 
 * @param {string} headerVal 
 * @returns {import('puppeteer').Protocol.Network.CookieParam[]}
 */
const parseCookies = (url, headerVal) => {
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
      expires: Math.ceil(Date.now()/1000 + 30)
    };
  });
}

/**
 * @param {import("aws-lambda").APIGatewayEvent} event
 * @returns {Config}
 */
export default function resolveConfig(event) {
  const {
    queryStringParameters: {
      url: urlString,
      strategy
    },
    headers = {}
  } = event;

  if(!urlString) {
    throw throwableResponse(400, 'missing url parameter');
  }

  let url;
  try {
    url = new URL(urlString);
  } catch {
    throw throwableResponse(400, 'invalid url parameter');
  }

  const config = {
    url,
    strategy,
    headers: {},
    cookies: {}
  }
  if(headers['x-set-cookie']) {
    // config.cookies = headers['x-set-cookies'].split(';').map(v => v.trim());
    config.cookies = parseCookies(url, headers['x-set-cookie']);
  }
  if(headers['x-set-headers']) {
    config.headers = parseMultiValueHeader(headers['x-set-headers']);
  }
  return config;
}