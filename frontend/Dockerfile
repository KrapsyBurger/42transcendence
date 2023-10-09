FROM node:lts-alpine

RUN apk update

WORKDIR /app

COPY . ./

RUN yarn global add @nestjs/cli
RUN yarn add axios
RUN yarn install

EXPOSE 3000

CMD [ "yarn", "start" ]