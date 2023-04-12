FROM public.ecr.aws/lambda/nodejs:18

COPY package*.json ${LAMBDA_TASK_ROOT}
COPY dist/index.js ${LAMBDA_TASK_ROOT}
COPY node_modules/@sparticuz/chromium ${LAMBDA_TASK_ROOT}/node_modules/@sparticuz/chromium

CMD [ "index.handler" ]