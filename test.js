import { handler } from './index.js';

await handler({
  queryStringParameters: {
    url: 'https://project.hlx.page/'
  },
  "headers": {
    "x-set-cookies": "hlx-auth-token=token"
  }
});