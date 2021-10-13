FROM node:16-alpine as builder

ENV NODE_ENV build

WORKDIR /usr/app

COPY ./package.json ./package-lock.json ./
COPY ./tsconfig.build.json ./tsconfig.json ./

RUN npm ci --no-audit

COPY ./src .

RUN npm run build

FROM node:16-alpine

ENV NODE_ENV production

WORKDIR /usr/app

COPY --from=builder /usr/app/package.json /usr/app/package-lock.json ./

RUN npm ci --no-audit

COPY --from=builder /usr/app/dist ./dist

ENV HOME $DATA_DIR

VOLUME $DATA_DIR

EXPOSE 3000

CMD ["node", "./dist/main.js"]
