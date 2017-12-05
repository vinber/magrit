FROM ubuntu:latest
MAINTAINER mth

RUN apt-get update && apt-get install -y software-properties-common && add-apt-repository ppa:fkrull/deadsnakes \
		&& apt-get update \
		&& apt-get install -y gcc libpython3.6-dev libopenblas-dev libopenblas-base \
        python3.6 python3.6-dev libgeos-dev \
        libfreetype6-dev libfreetype6 libproj-dev libspatialindex-dev libv8-3.14-dev libffi-dev \
        nodejs nodejs-dev node-gyp npm redis-server libuv1-dev unzip wget \
        libxslt1-dev libxml2 libxml2-dev libkml-dev \
    && npm -g install topojson \
    && rm -rf /var/lib/apt/lists/* \
    && ln -s /usr/bin/nodejs /usr/bin/node \
    && sed -e '/save/ s/^#*/#/' -i /etc/redis/redis.conf \
    && sysctl vm.overcommit_memory=1

WORKDIR /home

ENV GDALINST /home/gdalinstall
ENV GDALBUILD /home/gdalbuild
ENV GDALOPTS="  --with-geos \
		        --with-expat \
		        --without-libtool \
		        --without-gif \
		        --without-pg \
		        --without-grass \
		        --without-libgrass \
		        --without-cfitsio \
		        --without-pcraster \
		        --without-netcdf \
		        --without-gif \
		        --without-ogdi \
		        --without-fme \
		        --without-hdf4 \
		        --with-spatialite \
		        --with-static-proj4=/usr/lib"

RUN mkdir $GDALBUILD && mkdir $GDALINST && cd $GDALBUILD && wget http://download.osgeo.org/gdal/2.2.1/gdal-2.2.1.tar.gz \
    && tar -xzf gdal-2.2.1.tar.gz && cd gdal-2.2.1 && ./configure --prefix=$GDALINST/gdal-2.2.1 $GDALOPTS \
	&& make -s -j 2 && make install

ENV PATH="${GDALINST}/gdal-2.2.1/bin:${PATH}"
ENV LD_LIBRARY_PATH="${GDALINST}/gdal-2.2.1/lib:${LD_LIBRARY_PATH}"

ARG CACHEBUST=1

RUN rm -rf $GDALBUILD && mkdir /home/app && cd /home/app && wget https://github.com/riatelab/magrit/archive/master.zip && unzip master.zip && mv magrit-master magrit

RUN wget https://bootstrap.pypa.io/get-pip.py && python3.6 get-pip.py

RUN cd /home/app/magrit/ \
    && pip3.6 install -U -r requirements-dev.txt \
    && python3.6 setup.py build_ext --inplace

EXPOSE 9999

CMD service redis-server start \
    && gunicorn "magrit_app.app:create_app()" --bind 0.0.0.0:9999 --worker-class aiohttp.worker.GunicornUVLoopWebWorker --workers 1 --chdir /home/app/magrit/
