FROM klakegg/hugo:0.105.0 as hugo

WORKDIR /app
COPY . .
RUN hugo --minify

FROM nginx:latest

COPY --from=hugo /app/default.conf /etc/nginx/conf.d
COPY --from=hugo /app/public /usr/share/nginx/html
EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]