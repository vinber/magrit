/*
    Based on inter.c from Mark Newman
*/

#include <stdio.h>
#include <stdlib.h>

void reconstruct_grid(double *list_x, double *list_y,
                      double **gridx, double **gridy,
                      unsigned int xsize, unsigned int ysize){
  int ix,iy;
  for (iy=0; iy<=ysize; iy++) {
    for (ix=0; ix<=xsize; ix++) {
      gridx[ix][iy] = list_x[ix * xsize + iy];
	  gridy[ix][iy] = list_y[ix * xsize + iy];
    }
  }
}

double *transform_coords(double **gridx, double **gridy,
                         unsigned int xsize, unsigned int ysize,
                         double xin, double yin){
	int ix,iy;
	double xout,yout;
	double dx,dy;
	double *result;
	result = malloc(2 * sizeof(double));
	if ((xin<0.0)||(xin>=xsize)||(yin<0.0)||(yin>=ysize)) {
	  result[0] = xin;
	  result[1] = yin;
	} else {
	  ix = xin;
	  dx = xin - ix;
	  iy = yin;
	  dy = yin - iy;
	  xout = (1-dx)*(1-dy)*gridx[ix][iy] + dx*(1-dy)*gridx[ix+1][iy]
			 + (1-dx)*dy*gridx[ix][iy+1] + dx*dy*gridx[ix+1][iy+1];
	  yout = (1-dx)*(1-dy)*gridy[ix][iy] + dx*(1-dy)*gridy[ix+1][iy]
			 + (1-dx)*dy*gridy[ix][iy+1] + dx*dy*gridy[ix+1][iy+1];
	  result[0] = xout;
	  result[1] = yout;
	}
	return result;
}
