FROM node:12.18.3

LABEL version="1.0"
LABEL description="This is the base docker image for the frontend of the app"
LABEL maintainer = ["emiolaabdulmueez@gmail.com"]

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install --production

COPY . .

EXPOSE 3000

CMD ["npm", "start"]