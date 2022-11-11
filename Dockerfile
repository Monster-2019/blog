FROM klakegg/hugo:0.101.0-ext-alpine as hugo

WORKDIR /app
COPY . .
RUN hugo --minify

FROM nginx:1.23.1-alpine

COPY --from=hugo /app/default.conf /etc/nginx/conf.d
COPY --from=hugo /app/public /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]