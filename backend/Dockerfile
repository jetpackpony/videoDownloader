FROM node:20.9.0-bookworm-slim as base

# Update packages
RUN apt-get -y update \
  && apt-get -y upgrade

# Install add-apt-repository
RUN apt-get install -y software-properties-common \
  && apt-get install -y python3-launchpadlib

# Install ffmpeg and yt-dlp
RUN add-apt-repository ppa:tomtomtom/yt-dlp \
  && apt-get -y update \
  && apt-get install -y ffmpeg \
  && apt-get install -y yt-dlp

WORKDIR /home/node/app

# For dev copy the whole thing over
FROM base AS dev
ENV NODE_ENV=development
COPY . .
RUN npm install

# For building, copy the whole thing over and run a build command
FROM dev AS builder
RUN rm -rf ./build/*
RUN npm run build

# For production, run the builder, then copy the results over
FROM base AS prod
ENV NODE_ENV=production
COPY package*.json ./
RUN npm install
COPY --from=builder /home/node/app/build ./build
COPY --from=builder /home/node/app/public ./public
RUN mkdir -p /home/node/app/tmp
