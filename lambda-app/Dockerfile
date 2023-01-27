FROM public.ecr.aws/lambda/nodejs:18

COPY package.json ${LAMBDA_TASK_ROOT}/

RUN npm install

COPY app.js map.xml ${LAMBDA_TASK_ROOT}/

CMD [ "app.handler" ]
