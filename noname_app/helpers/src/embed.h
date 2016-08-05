/* Header file for embed.c */
#ifndef EMBED_H
#define EMBED_H
void embed_main(int xsize, int ysize, double *dens, double *gridx, double *gridy);
int embed_readpop(double *dens, double **rho, int xsize, int ysize);
void embed_creategrid(double *gridx, double *gridy, int xsize, int ysize);
#endif
