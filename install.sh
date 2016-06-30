#!/bin/sh
sudo apt-get -y install libgdal-dev libproj-dev libv8-dev libffi-dev libpython3.5-dev r-base redis-server nodejs npm libfftw3-dev libzmq-dev python3.5-numpy python3.5-gdal
sudo npm -g install topojson
sudo -H python3.5 -m pip install -r requirements.txt
mkdir tmpdir
cd tmpdir
echo "chooseCRANmirror(ind=10)
install.packages(\"devtools\")
require(devtools)
install.packages(\"rgeos\")
install.packages(\"jsonlite\")
install.packages(\"sp\")
devtools::install_github(\"ropensci/geojsonio\")
devtools::install_github(\"Groupe-ElementR/SpatialPosition\")
devtools::install_github(\"Groupe-ElementR/Cartography\")
devtools::install_github(\"RBigData/pbdZMQ\")" > r_packages.R
Rscript r_packages.R
cd ..
rm -rf tmpdir/
cythonize app/helpers/transform.pyx
cythonize app/helpers/cartogram_doug.pyx
cythonize app/helpers/cy_misc.pyx
gcc -shared -fPIC -fwrapv -O2 -Wall -fno-strict-aliasing -I/usr/include/python3.5 -o app/helpers/cartogram_doug.so app/helpers/cartogram_doug.c
gcc -shared -fPIC -fwrapv -O2 -Wall -fno-strict-aliasing -I/usr/include/python3.5 -o app/helpers/cy_misc.so app/helpers/cy_misc.c
gcc -shared -fPIC -fwrapv -O2 -Wall -fno-strict-aliasing -I/usr/include/python3.5 -o app/helpers/transform.so app/helpers/transform.c
chmod +x app/noname_aio.py
