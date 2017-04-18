"use strict";
const sin = Math.sin,
    asin = Math.asin,
    abs = Math.abs,
    cos = Math.cos;

const NITER = 20,
    EPS = 1e-7,
    ONETOL = 1.000001,
    CN = 2.67595,
    CS = 2.43763,
    RCN = 0.37369906014686373063,
    RCS = 0.41023453108141924738,
    FYCN = 1.75859,
    FYCS = 1.93052,
    RYCN = 0.56863737426006061674,
    RYCS = 0.51799515156538134803,
    FXC = 0.85,
    RXC = 1.17647058823529411764,
    M_HALFPI = Math.PI / 2;

function hatanoRaw(lambda, phi) {
  let th1, c, i;
  c = sin(phi) * (phi < 0 ? CS : CN);
  for(i = NITER; i; --i){
      phi -= th1 = (phi + sin(phi) - c) / (1 + cos(phi));
      if(abs(th1) < EPS) break;
  }
  return [
    FXC * lambda * cos(phi *= 0.5),
    sin(phi) * (phi < 0 ? FYCS : FYCN)
  ];
}

hatanoRaw.invert = function(x, y) {
  let xx = x,
      yy = y;
  let th = yy * (yy < 0 ? RYCS : RYCN);
  if(abs(th) > 1){
      if(abs(th) > ONETOL){
          console.log('Error');
          return;
      } else {
        th = th > 0 ? M_HALFPI : -M_HALFPI;
      }
  } else {
      th = asin(th);
  }
  xx = RXC * xx / cos(th);
  th += th;
  yy = (th + sin(th)) * (yy < 0 ? RCS : RCN);
  if(abs(yy) > 1){
      if(abs(yy) > ONETOL){
          console.log('Error');
          return;
      } else {
          yy = yy > 0 ? M_HALFPI : -M_HALFPI;
      }
  } else {
      yy = asin(yy);
  }
  return [xx,  yy];
};

function winkel1Raw(lat_truescale) {
  const cosphi1 = cos(lat_truescale);

  function forward(lambda, phi) {
    let x = lambda, y = phi;
    return [0.5 * x * (cosphi1 + cos(phi)), y];
  }

  forward.invert = function(x, y) {
    let lambda = x, phi = y;
    return [2 * lambda / (cosphi1 + cos(phi)), phi];
  };

  return forward;
}

(d3.geoWinkel1 = (function(){
    return d3.geoProjection(winkel1Raw(45)).scale(200);
}));

(d3.geoHatano = (function(){
    return d3.geoProjection(hatanoRaw).scale(200);
}));
