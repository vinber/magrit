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
  const c = sin(phi) * (phi < 0 ? CS : CN);
  let y = phi;
  let th1;
  let i;
  for (i = NITER; i; --i) {
    y -= th1 = (y + sin(y) - c) / (1 + cos(y));
    if (abs(th1) < EPS) break;
  }
  return [
    FXC * lambda * cos(y *= 0.5),
    sin(y) * (y < 0 ? FYCS : FYCN),
  ];
}

hatanoRaw.invert = (x, y) => {
  let xx = x;
  let yy = y;
  let th = yy * (yy < 0 ? RYCS : RYCN);
  if (abs(th) > 1) {
    if (abs(th) > ONETOL) {
      console.log('Error');
      return [NaN, NaN];
    }
    th = th > 0 ? M_HALFPI : -M_HALFPI;
  } else {
    th = asin(th);
  }
  xx = RXC * xx / cos(th);
  th += th;
  yy = (th + sin(th)) * (yy < 0 ? RCS : RCN);
  if (abs(yy) > 1) {
    if (abs(yy) > ONETOL) {
      console.log('Error');
      return [NaN, NaN];
    }
    yy = yy > 0 ? M_HALFPI : -M_HALFPI;
  } else {
    yy = asin(yy);
  }
  return [xx, yy];
};

function winkel1Raw(lat_truescale) {
  const cosphi1 = cos(lat_truescale);

  function forward(lambda, phi) {
    let x = lambda;
    let y = phi;
    return [0.5 * x * (cosphi1 + cos(phi)), y];
  }

  forward.invert = (x, y) => {
    let lambda = x;
    let phi = y;
    return [2 * lambda / (cosphi1 + cos(phi)), phi];
  };

  return forward;
}

(d3.geoWinkel1 = (() => d3.geoProjection(winkel1Raw(45)).scale(200)));

(d3.geoHatano = (() => d3.geoProjection(hatanoRaw).scale(200)));
