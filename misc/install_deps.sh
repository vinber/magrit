#!/bin/sh

set -ex

if [ ! -d "$OTHER_PY_PACKAGES" ]; then
  mkdir $OTHER_PY_PACKAGES;
  git clone http://github.com/mthh/smoomapy
  cd smoomapy/
  python setup.py install
fi
cd $TRAVIS_BUILD_DIR
