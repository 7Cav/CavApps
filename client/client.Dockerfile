# Build

FROM node:lts-alpine

RUN apk add --no-cache curl wget

WORKDIR /client

# Acquire dependencies

COPY package*.json ./

RUN npm install

# Copy source code

COPY . .

# The release tag, passed by the deploy workflow. GET /version reports it.
# A local build leaves it empty and the route answers "dev". Declared last so
# a new tag rebuilds only this layer.

ARG VERSION
ENV APP_VERSION=$VERSION

# Expose, Deployment is handled by compose to allow server to start first

EXPOSE 3000