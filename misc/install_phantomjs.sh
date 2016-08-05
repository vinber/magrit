#!/bin/sh

set -ex

if [ ! -d "$PHANTOMJSDIR" ]; then
  mkdir $PHANTOMJSDIR;
fi

if [ ! -d $PHANTOMJSDIR/phantomjs-2.1.1-linux-x86_64 ]; then
  cd $PHANTOMJSDIR
  wget https://bitbucket.org/ariya/phantomjs/downloads/phantomjs-2.1.1-linux-x86_64.tar.bz2
  tar xvjf phantomjs-2.1.1-linux-x86_64.tar.bz2
fi

cd $TRAVIS_BUILD_DIR

