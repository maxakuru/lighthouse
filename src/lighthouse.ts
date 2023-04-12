import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import BASE_DESKTOP_CONFIG from 'lighthouse/core/config/lr-desktop-config.js';
import BASE_MOBILE_CONFIG from 'lighthouse/core/config/lr-desktop-config.js';
import chromium from '@sparticuz/chromium';
import { throwableResponse } from './response.js';

import type { Flags, Config } from 'lighthouse';
import type { Browser } from 'puppeteer';


const FLAGS: Flags = {
  disableFullPageScreenshot: true,
};

const DESKTOP_CONFIG: Config = {
  ...BASE_DESKTOP_CONFIG,
}

const MOBILE_CONFIG: Config = {
  ...BASE_MOBILE_CONFIG,
  settings: {
    ...BASE_MOBILE_CONFIG.settings,
    maxWaitForFcp: 15 * 1000,
    maxWaitForLoad: 35 * 1000,
    throttlingMethod: 'simulate',
    throttling: {
      requestLatencyMs: 150,
      uploadThroughputKbps: 750,
      downloadThroughputKbps: 1600,
      cpuSlowdownMultiplier: 1,
    },
  }
};


export default async function runLighthouse(config) {
  const { url, strategy = 'mobile', cookies } = config;

  console.debug('[Lighthouse] running on url: ', url.toString());

  let browser: Browser;
  if (process.env.NODE_ENV === 'testing') {
    browser = await puppeteer.launch({
      headless: 'new',
      defaultViewport: chromium.defaultViewport,
      args: chromium.args,
    });
  } else {
    const executablePath = await chromium.executablePath();
    browser = await puppeteer.launch({
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      args: chromium.args,
    });
  }

  const page = await browser.newPage();

  if (cookies && cookies.length) {
    await page.setCookie(...cookies);
  }

  const resp = await lighthouse(
    url.toString(),
    FLAGS,
    strategy === 'desktop' ? DESKTOP_CONFIG : MOBILE_CONFIG,
    page
  );
  if (!resp) {
    throw throwableResponse(500, 'failed to run lighthouse');
  }

  const { lhr: result } = resp;
  if (result.runWarnings && cookies && cookies.find(c => c.name === 'hlx-auth-token')) {
    const redirectedToLogin = result.runWarnings.find(warning => warning.includes('was redirected to https://login.microsoftonline.com'));
    if (redirectedToLogin) {
      throw throwableResponse(401, 'authorization error', redirectedToLogin);
    }
  }

  // don't wait for browser close
  // it should be cleaned up anyway, and waiting causes a timeout often
  // await browser.close();
  page.close();

  if (result.runtimeError) {
    console.info('[Lighthouse] runtime error: ', result.runtimeError);
    const { code, message } = result.runtimeError;
    throw throwableResponse(500, `error from lighthouse: ${code}`, message);
  }

  // const summary = Object.keys(result.categories).reduce((prev, category) => {
  //   const { score } = result.categories[category];
  //   return { 
  //     ...prev, 
  //     [category]: score
  //   };
  // }, {});
  // console.log(`[Lighthouse] summary: `, summary);

  return result;
}