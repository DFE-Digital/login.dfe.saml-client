FROM node:8

WORKDIR /app
ADD . /app

RUN cd /app
RUN npm install
RUN npm run setup

EXPOSE 44301

CMD ["node", "src/index.js"]