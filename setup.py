#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-

from distutils.core import setup
from distutils.extension import Extension
from Cython.Distutils import build_ext
from Cython.Build import cythonize
import noname_app

with open("requirements.txt") as f:
    requirements = f.read().split('\n')

exts = [Extension("noname_app.helpers.cy_misc",
                  ["noname_app/helpers/cy_misc.pyx"], ["."],
                  extra_compile_args=["-O3"]),
        Extension("noname_app.helpers.transform",
                  ["noname_app/helpers/transform.pyx"], ["."],
                  extra_compile_args=["-O3"]),
        Extension("noname_app.helpers.cartogram_doug",
                  ["noname_app/helpers/cartogram_doug.pyx"], ["."],
                  extra_compile_args=["-O3"]),
        Extension("noname_app.helpers.cy_cart",
                  ["cy_cart.pyx", "embed.c", "cart.c", "interp_mat.c"], ["."],
                  libraries=["fftw3"])
        ]

setup(
    name='noname_app',
    version=noname_app.__version__,
    description="",
    url='https://github.com/mthh/noname-stuff',
    packages=['noname_app'],
    package_dir={},
    ext_modules=cythonize(exts),
    cmdclass = {'build_ext': build_ext},
    install_requires=requirements,
    test_suite='tests',
    entry_points={
        'console_scripts': [
            'noname_app=noname_app.noname_aio:main',
        ],
    },
)
