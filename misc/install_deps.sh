#!/bin/sh

set -ex

if [ ! -d "$OTHER_PY_PACKAGES" ]; then
  mkdir $OTHER_PY_PACKAGES;
fi
  cd $OTHER_PY_PACKAGES
  rm -rf smoomapy
  git clone http://github.com/mthh/smoomapy
  cd smoomapy/
  pip install -r requirements.txt
  python setup.py install
cd $TRAVIS_BUILD_DIR
