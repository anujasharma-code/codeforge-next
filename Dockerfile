FROM node:20-alpine

ENV NODE_ENV=production
ENV PORT=8080

WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY --chown=node:node . .
RUN chown node:node /app

USER node
EXPOSE 8080
CMD ["npm", "start"]
