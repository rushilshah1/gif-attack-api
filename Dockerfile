FROM node:12.7.0-alpine

LABEL maintainer="rushilrshah1@gmail.com"

WORKDIR /usr/src/app

COPY package.json .

RUN npm install

COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]
