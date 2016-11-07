FROM ubuntu
RUN apt-get update && apt-get install -y nginx
RUN ln -sf /dev/stdout /var/log/nginx/access.log
RUN ln -sf /dev/stderr /var/log/nginx/error.log
RUN rm -rf /etc/nginx/sites-enabled/default
EXPOSE 80
COPY nginx.conf /etc/nginx/sites-enabled/magritapp
CMD ["nginx", "-g", "daemon off;"]
