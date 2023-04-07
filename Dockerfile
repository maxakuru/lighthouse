FROM public.ecr.aws/lambda/nodejs:18

COPY package*.json ${LAMBDA_TASK_ROOT}
COPY lib/ ${LAMBDA_TASK_ROOT}/lib
COPY index.js ${LAMBDA_TASK_ROOT}

RUN npm install --omit=dev

CMD [ "index.handler" ]