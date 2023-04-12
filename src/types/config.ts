import type { Protocol } from 'puppeteer';

export type CookieConfig = Protocol.Network.CookieParam;

export interface Config {
  strategy?: 'mobile' | 'desktop';
  url: URL;
  cookies: CookieConfig[];
}