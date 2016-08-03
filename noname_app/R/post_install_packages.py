# -*- coding: utf-8 -*-
import os
import subprocess

print("R packages installation...")
with open("/tmp/r_packages.r", "w") as f:
    f.write("""chooseCRANmirror(ind=10);
        install.packages(\"devtools\");
        require(devtools);
        install.packages(\"R6\");
        install.packages(\"rgeos\");
        install.packages(\"jsonlite\");
        install.packages(\"sp\");
        devtools::install_github(\"ropensci/geojsonio\");
        devtools::install_github(\"Groupe-ElementR/SpatialPosition\");
        devtools::install_github(\"Groupe-ElementR/Cartography\")
        devtools::install_github(\"RBigData/pbdZMQ\");
        """)
p = subprocess.Popen(["Rscript", "--vanilla", "/tmp/r_packages.r"],
                     stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE)
stdout, stderr = p.communicate()
os.remove("/tmp/r_packages.r")

print("R packages installation verification ...")
with open("/tmp/r_test.r", "w") as f:
    f.write("""
    tryCatch(expr = suppressMessages(library(geojsonio, silent=TRUE)),
                    suppressMessages(library(jsonlite)),
                    suppressMessages(library(SpatialPosition)),
                    suppressMessages(library(cartography)),
                    suppressMessages(library(pbdZMQ)),
            error = function(e) print(e),
            warning = function(e) NULL);
        """)
p = subprocess.Popen(["Rscript", "--vanilla", "r_test.r"],
                     stdout=subprocess.PIPE,
                     stderr=subprocess.PIPE)
stdout, stderr = p.communicate()
os.remove("/tmp/r_test.r")
if stderr:
    raise ValueError(
        "R packages weren't fully installed\nReturned message : {}"
        .format(stderr.decode()))

