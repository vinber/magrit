#!/bin/sh
# script largely inspired by gdal install script of rasterio python package:
#  https://github.com/mapbox/rasterio/blob/master/scripts/travis_gdal_install.sh

set -ex

GDALOPTS="  --with-ogr \
            --with-geos \
            --with-expat \
            --without-libtool \
            --with-libz=internal \
            --with-libtiff=internal \
            --with-geotiff=internal \
            --without-gif \
            --without-pg \
            --without-grass \
            --without-libgrass \
            --without-cfitsio \
            --without-pcraster \
            --without-netcdf \
            --with-png=internal \
            --with-jpeg=internal \
            --without-gif \
            --without-ogdi \
            --without-fme \
            --without-hdf4 \
            --with-hdf5 \
            --without-jasper \
            --without-ecw \
            --without-kakadu \
            --without-mrsid \
            --without-jp2mrsid \
            --without-bsb \
            --without-grib \
            --without-mysql \
            --without-ingres \
            --without-xerces \
            --without-odbc \
            --with-curl \
            --without-sqlite3 \
            --without-dwgdirect \
            --without-idb \
            --without-sde \
            --without-perl \
            --without-php \
            --without-ruby \
            --without-python \
            --with-static-proj4=/usr/lib"

# Create build dir if not exists
if [ ! -d "$GDALBUILD" ]; then
  mkdir $GDALBUILD;
fi

if [ ! -d "$GDALINST" ]; then
  mkdir $GDALINST;
fi

if [ ! -d $GDALINST/gdal-2.1.0 ]; then
  cd $GDALBUILD
  wget http://download.osgeo.org/gdal/2.1.0/gdal-2.1.0.tar.gz
  tar -xzf gdal-2.1.0.tar.gz
  cd gdal-2.1.0
  ./configure --prefix=$GDALINST/gdal-2.1.0 $GDALOPTS
  make -s -j 2
  make install
fi
# change back to travis build dir
cd $TRAVIS_BUILD_DIR
