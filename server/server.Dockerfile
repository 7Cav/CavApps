# Build

FROM node:lts-alpine

RUN apk add --no-cache curl

WORKDIR /server

# Acquire dependencies

COPY package*.json ./

RUN npm install

# Copy server source code

COPY . .

# The release tag, passed by the deploy workflow. GET /version reports it.
# A local build leaves it empty and the route answers "dev". Declared last so
# a new tag rebuilds only this layer.

ARG VERSION
ENV APP_VERSION=$VERSION

# Deploy

EXPOSE 4000

CMD ["node", "server.js"]