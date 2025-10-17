FROM node:20.19.5


WORKDIR /usr/src/app


COPY package*.json ./
RUN npm ci --only=production


COPY . .





EXPOSE 3000


RUN groupadd -r appgroup && useradd -m -r -g appgroup appuser
USER appuser


CMD ["node", "src/app.js"]
