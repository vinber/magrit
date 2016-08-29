#!/bin/sh

set -ex

if [ ! -d "$SMOOMAPY" ]; then
  mkdir $SMOOMAPY;
  git clone http://github.com/mthh/smoomapy
  python setup.py install
fi
cd $TRAVIS_BUILD_DIR
