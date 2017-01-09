### Magrit - Thematic cartography

#### Usage

Most users should go on :
- the [application page](...)
- the [user documentation](...)


#### Installation for developpement
Installation of the required libraries :
(Ubuntu 16.04)
```
# apt-get install -y gcc libpython3.5-dev libopenblas-dev libopenblas-base python3.5 python3.5-dev nodejs python3-pip \
  gdal-bin libgdal-dev libfreetype6-dev libfreetype6 libproj-dev libspatialindex-dev libv8-3.14-dev libffi-dev \
        nodejs nodejs-dev node-gyp npm redis-server libuv1-dev git wget libxslt1-dev libxml2 libxml2-dev
```

Using a python virtual environnement:

```bash
$ git clone https://github.com/riatelab/magrit
$ cd magrit
$ virtualenv venv -p /usr/bin/python3.5
$ source venv/bin/activate
(venv)$ pip install -r requirements-dev.txt
(venv)$ python setup.py install
```

#### Launching the application:
```bash
(venv)$ magrit -p 9999
INFO:magrit.main:serving on('0.0.0.0', 9999)
....
```

#### Deployement with docker :
##### Using the latest provided image :
....


##### Using the developpement version of the application (+ nginx for static files)

```` bash
cd /tmp/
mkdir magritapp
# Clone the developpement version :
git clone http://github.com/mthh/magrit
# Copy the two Dockerfile :
cp -r magrit/misc/Docker/ magritapp/
# Copy the static files :
cp -r magrit/noname_app/static/ magritapp/Docker/nginx/
# Make some clean up :
rm -rf magrit
# Setting up the magrit image:
cd magritapp/Docker
cd app/
docker build -t "magrit_app:latest" --build-arg CACHEBUST=$(date +%s) .
# Setting up the nginx image:
cd ..
cd nginx/
docker build -t "nginx:latest" .
cd ..
# Starting the application (will be accessible on port 80) :
docker run -dP --name magritapp "magrit_app:latest"
docker run --publish "80:80" -dP --name nginx --link magritapp:magritapp nginx
````
....


#### Contributing to Magrit :
Contributions are welcome ! There is various way to contribute to the project:
- Feedback and bug reports
- Translation (only French and English languages are currently availables)
- Code contribution (you're one the right place! Clone the repo, fix what you want to be fix and submit a pull request)
- Contributing to the [gallery](...)
