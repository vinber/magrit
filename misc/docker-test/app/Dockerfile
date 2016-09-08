FROM ubuntu:latest
MAINTAINER MMtthhhhh

RUN apt-get update && apt-get install -y gcc libpython3.5-dev libopenblas-dev libopenblas-base \
        python3.5 python3.5-dev nodejs python3-numpy python3-pip gdal-bin libgdal-dev \
        libfreetype6-dev libfreetype6 libproj-dev libv8-3.14-dev libffi-dev \
        nodejs nodejs-dev node-gyp npm git wget \
        && npm -g install topojson && rm -rf /var/lib/apt/lists/*

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


RUN mkdir $GDALBUILD && mkdir $GDALINST && cd $GDALBUILD && wget http://download.osgeo.org/gdal/2.1.0/gdal-2.1.0.tar.gz \
    && tar -xzf gdal-2.1.0.tar.gz && cd gdal-2.1.0 && ./configure --prefix=$GDALINST/gdal-2.1.0 $GDALOPTS \
	&& make -s -j 2 && make install

# COPY install_gdal.sh /home/
# RUN chmod +x /home/install_gdal.sh && ./home/install_gdal.sh

ENV PATH="${GDALINST}/gdal-2.1.0/bin:${PATH}"
ENV LD_LIBRARY_PATH="${GDALINST}/gdal-2.1.0/lib:${LD_LIBRARY_PATH}"

RUN pip3 install -U pip \
        && mkdir /home/app && cd /home/app \
        && git clone http://github.com/mthh/noname-stuff/ -b "with-no-R" \
        && cd noname-stuff/ \
        && pip3 install -r requirements-dev.txt \
        && python3 setup.py install

RUN cd /home/app && git clone http://github.com/mthh/smoomapy/ -b "dev" \
        && cd smoomapy/ && pip3 install -r requirements.txt \
        && python3 setup.py install && cd /home/app

EXPOSE 9999

CMD ["noname_app"]
