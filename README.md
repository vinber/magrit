[![png](magrit_app/static/img/magrit_banner.png)](http://magrit.cnrs.fr)    

[![Build Status](https://travis-ci.org/riatelab/magrit.svg?branch=master)](https://travis-ci.org/riatelab/magrit)  

[Magrit](http://magrit.cnrs.fr) is an online mapping application developed by [UMS RIATE](http://www.riate.cnrs.fr).  

## Usage

Most users should go on :
- the [application page](http://magrit.cnrs.fr)
- the [user documentation](http://magrit.cnrs.fr/docs/)
- the [blog](http://magrit.hypotheses.org)


## Instruction for developers

The only targeted/tested OS for development is currently GNU/Linux. However, you can install it on other platforms, which are supported by Docker (GNU/Linux, FreeBSD, Windows 64bits, MAC OSX).

Magrit uses JS (particularly the D3 library) in the browser for interface and map rendering.
Some geoprocessing tasks are delegated to the server part: a python 3.5+ application.

Magrit can be served or build by various means:

- [Installing for development](https://github.com/riatelab/magrit/wiki/Installation-for-development)
- [Installing for development (with a python virtual environnement)](https://github.com/riatelab/magrit/wiki/Installation-for-development)
- [Deploying with Docker](https://github.com/riatelab/magrit/wiki/Installation-with-Docker)


## Examples :
<p><img src="https://magrit.hypotheses.org/files/2017/02/worldpop.png" height="250"/><img src="https://magrit.hypotheses.org/files/2017/02/smoothed2.png" height="250"/><img src="https://raw.githubusercontent.com/mthh/magrit/master/magrit_app/static/img/gallery/popdensity_africa.png" height="250"/></p>

More examples are available in the [gallery](http://magrit.hypotheses.org/galerie).


## Contributing to Magrit :

Contributions are welcome! There are various way to contribute to the project:
- Feedback and bug reports
- Translation (French, English and Spanish languages are currently available)
- Code contribution (you're one the right place! Clone the repo, fix what you want to be fixed and submit a pull request)
- Contribute to the [gallery](http://magrit.hypotheses.org/galerie)
