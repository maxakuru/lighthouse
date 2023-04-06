import puppeteer from 'puppeteer';
import lighthouse from 'lighthouse';
import chromium from '@sparticuz/chromium';

/** @type {import('lighthouse').Flags} */
const FLAGS = {
  disableFullPageScreenshot: true,
};

/** @type {import('lighthouse').Config} */
const MOBILE_CONFIG = {
  extends: 'lighthouse:default',
  settings: {
    throttlingMethod: 'simulate',
    throttling: {
      requestLatencyMs: 150,
      uploadThroughputKbps: 750,
      downloadThroughputKbps: 1600,
      cpuSlowdownMultiplier: 1,
    },
    disableFullPageScreenshot: true,
  }
};

/**
 * @type {import('aws-lambda').Handler<import('aws-lambda').APIGatewayEvent>}
 */
export const handler = async (event) => {
  const { url } = event.queryStringParameters;
  if(!url) {
    return {
      statusCode: 400,
      body: 'missing url parameter'
    }
  }

  try {
    console.debug('[Lighthouse] running on url: ', url);

    const executablePath = await chromium.executablePath();
    const browser = await puppeteer.launch({
      headless: chromium.headless,
      defaultViewport: chromium.defaultViewport,
      executablePath,
      args: chromium.args,
    });

    const page = await browser.newPage();

    const { lhr: result } = await lighthouse(url, FLAGS, MOBILE_CONFIG, page);

    // don't wait for browser close
    // it should be cleaned up anyway, and waiting causes a timeout often
    // await browser.close();

    if(result.runtimeError) {
      console.info('[Lighthouse] runtime error: ', result.runtimeError);

      return {
        statusCode: 400,
        headers : {
          "content-type": "application/json"
        },
        body: JSON.stringify(result.runtimeError)
      }
    }

    // const summary = Object.keys(result.categories).reduce((prev, category) => {
    //   const { score } = result.categories[category];
    //   return { 
    //     ...prev, 
    //     [category]: score
    //   };
    // }, {});
    // console.log(`[Lighthouse] summary: `, summary);

    return {
      statusCode: 200,
      headers : {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        lighthouseResult: result
      })
    }
  } catch(e) {
    console.error('runtime error: ', e);
    return {
      statusCode: 500,
      headers : {
        "content-type": "application/json"
      },
      body: JSON.stringify({
        message: e.message
      })
    }
  }
}