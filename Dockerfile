FROM node:alpine

LABEL maintainer="rushilrshah1@gmail.com"

WORKDIR /usr/src/app

COPY package.json .

RUN npm install
# Bundle app source
COPY . .

EXPOSE 4000

CMD [ "npm", "start" ]
