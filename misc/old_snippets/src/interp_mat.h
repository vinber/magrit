#ifndef _INTERP_MAT_H
#define _INTERP_MAT_H
void reconstruct_grid(double *list_x, double *list_y, double **gridx, double **gridy,
	       int xsize, int ysize);
double *transform_coords(double **gridx, double **gridy,
		unsigned int xsize, unsigned int ysize, double xin, double yin);
#endif
