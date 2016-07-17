#!/usr/bin/env python3.5
# -*- coding: utf-8 -*-
from setuptools import find_packages
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
        Extension(
            "noname_app.helpers.cy_cart",
            ["noname_app/helpers/cy_cart.pyx", "noname_app/helpers/src/cart.c",
             "noname_app/helpers/src/embed.c", "noname_app/helpers/src/interp_mat.c"],
            ["."], libraries=["fftw3"], extra_compile_args=["-O2"])
        ]

setup(
    name='noname_app',
    version=noname_app.__version__,
    description="",
    url='https://github.com/mthh/noname-stuff',
    packages=find_packages(),
    package_dir={},
    ext_modules=cythonize(exts),
    cmdclass={'build_ext': build_ext},
    install_requires=requirements,
    test_suite='tests',
    include_package_data=True,
    entry_points={
        'console_scripts': [
            'noname_app=noname_app.noname_aio:main',
        ],
    },
)
