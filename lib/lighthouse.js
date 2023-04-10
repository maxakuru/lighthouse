import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import BASE_DESKTOP_CONFIG from 'lighthouse/core/config/lr-desktop-config.js';
import BASE_MOBILE_CONFIG from 'lighthouse/core/config/lr-desktop-config.js';
import chromium from '@sparticuz/chromium';
import { throwableResponse } from './response.js';

/** @type {import('lighthouse').Flags} */
const FLAGS = {
  disableFullPageScreenshot: true,
};

/** @type {import('lighthouse').Config} */
const DESKTOP_CONFIG = {
  ...BASE_DESKTOP_CONFIG,
}

/** @type {import('lighthouse').Config} */
const MOBILE_CONFIG = {
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

/**
 * @param {import('./config').Config} config
 */
export default async function runLighthouse(config) {
  const { url, strategy = 'mobile', cookies } = config;

  console.debug('[Lighthouse] running on url: ', url.toString());

  /** @type {import('puppeteer').Browser} */
  let browser;
  if(process.env.NODE_ENV === 'testing') {
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

  if(cookies && cookies.length) {
    await page.setCookie(...cookies);
  }

  const { lhr: result } = await lighthouse(
    url.toString(), 
    FLAGS, 
    strategy === 'desktop' ? DESKTOP_CONFIG : MOBILE_CONFIG, 
    page
  );

  if(result.runWarnings && cookies && cookies.find(c => c.name === 'hlx-auth-token')) {
    const redirectedToLogin = result.runWarnings.find(warning => warning.includes('was redirected to https://login.microsoftonline.com'));
    if(redirectedToLogin) {
      throw throwableResponse(401, 'authorization error', redirectedToLogin);
    }
  }

  // don't wait for browser close
  // it should be cleaned up anyway, and waiting causes a timeout often
  // await browser.close();
  page.close();

  if(result.runtimeError) {
    console.info('[Lighthouse] runtime error: ', result.runtimeError);
    const { status, message } = result.runtimeError;
    throw throwableResponse(status, 'error from lighthouse', message);
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