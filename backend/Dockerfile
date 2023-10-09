FROM node:lts-alpine


RUN apk update

WORKDIR /app

COPY . ./

RUN yarn global add @nestjs/cli
RUN yarn install
RUN yarn build

EXPOSE 3333

ENTRYPOINT ["sh", "entrypoint.sh"]

CMD ["yarn", "start:prod"]