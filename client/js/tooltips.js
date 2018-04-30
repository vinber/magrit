import tippy from 'tippy.js';

/* eslint-disable object-property-newline */
function parseMatrix(matrixString) {
  const c = matrixString.split(/\s*[(),]\s*/).slice(1, -1);

  if (c.length === 6) {
    return {
      m11: +c[0], m21: +c[2], m31: 0, m41: +c[4],
      m12: +c[1], m22: +c[3], m32: 0, m42: +c[5],
      m13: 0, m23: 0, m33: 1, m43: 0,
      m14: 0, m24: 0, m34: 0, m44: 1,
    };
  } else if (c.length === 16) {
    return {
      m11: +c[0], m21: +c[4], m31: +c[8], m41: +c[12],
      m12: +c[1], m22: +c[5], m32: +c[9], m42: +c[13],
      m13: +c[2], m23: +c[6], m33: +c[10], m43: +c[14],
      m14: +c[3], m24: +c[7], m34: +c[11], m44: +c[15],
    };
  }
  // handle 'none' or invalid values.
  return {
    m11: 1, m21: 0, m31: 0, m41: 0,
    m12: 0, m22: 1, m32: 0, m42: 0,
    m13: 0, m23: 0, m33: 1, m43: 0,
    m14: 0, m24: 0, m34: 0, m44: 1,
  };
}
/* eslint-enable object-property-newline */
const asin = Math.asin;
const cos = Math.cos;
const atan2 = Math.atan2;

function getTransform(elem) {
  const matrix = parseMatrix(getComputedStyle(elem, null).transform);
  const rotateY = asin(-matrix.m13);
  let rotateX;
  let rotateZ;

  if (cos(rotateY) !== 0) {
    rotateX = atan2(matrix.m23, matrix.m33);
    rotateZ = atan2(matrix.m12, matrix.m11);
  } else {
    rotateX = atan2(-matrix.m31, matrix.m22);
    rotateZ = 0;
  }
  return {
    rotate: { x: rotateX, y: rotateY, z: rotateZ },
    translate: { x: matrix.m41, y: matrix.m42, z: matrix.m43 },
  };
}

export function bindTooltips() {
  tippy('.tt_menuleft', {
    // appendTo: document.querySelector('.twbs'),
    arrow: true,
    duration: [1, 50],
    flip: false,
    onShow() {
      Array.prototype.slice.call(document.querySelectorAll('.tippy-popper')).forEach(popper => {
        const instance = popper._tippy;
        if (instance.state.visible) {
          instance.popperInstance.disableEventListeners();
          instance.hide();
        }
      });
    },
    onShown() {
      const tr = getTransform(this);
      this.style.transform = `translate3d(${tr.translate.x + 360}px, ${tr.translate.y}px, 0)`;
    },
    placement: 'right',
  });

  tippy('.tt', {
    // appendTo: document.querySelector('.twbs'),
    arrow: true,
    duration: [50, 50],
    flip: false,
  });

  tippy('.tt_func', {
    // appendTo: document.querySelector('.twbs'),
    arrow: true,
    distance: 45,
    duration: [20, 20],
    flip: false,
    placement: 'right',
  });
}
