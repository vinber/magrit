## Magrit - Thematic cartography

![png](magrit_app/static/img/logo_magrit2.png)

"Magrit" is an online mapping application developed by the RIATE UMS (http://www.ums-riate.fr).  
This tool makes it possible to produce **thematic maps** of a **high graphic quality**.   
In addition to proposing to the user all the usual cartographic representations, the application offers the possibility to realize many cartographic methods often difficult to implement: *smoothing*, *grids*, *discontinuities*, *cartograms*, etc.   Ultimately, Magrit intends to cover the entire processing chain, from the geographical data to the editing card, in a single environment, .

#### Result examples :

<p><img src="https://magrit.hypotheses.org/files/2017/02/worldpop.png" height="250"/><img src="https://magrit.hypotheses.org/files/2017/02/smoothed2.png" height="250"/></p>


More example are availables on the [gallery](http://magrit.hypotheses.org/galerie).

#### Usage

Most users should go on :
- the [application page](http://magrit.cnrs.fr)
- the [user documentation](http://magrit.cnrs.fr/docs/)


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
##### Using the latest version of the application (+ nginx for static files)

```` bash
cd /tmp/
mkdir magritapp
# Clone the developpement version :
git clone http://github.com/riatelab/magrit
# Copy the two Dockerfile :
cp -r magrit/misc/Docker/ magritapp/
# Copy the static files :
cp -r magrit/magrit_app/static/ magritapp/Docker/nginx/
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


#### Contributing to Magrit :
Contributions are welcome ! There is various way to contribute to the project:
- Feedback and bug reports
- Translation (only French and English languages are currently availables)
- Code contribution (you're one the right place! Clone the repo, fix what you want to be fix and submit a pull request)
- Contributing to the [gallery](http://magrit.hypotheses.org/galerie)
