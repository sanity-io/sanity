/* eslint-disable */
// Polyfills HTMLCanvasElement.toBlob
require('canvas-to-blob').init();

/**
 * Check if we need to change dims.
 */

function rotated(n) {
  return [5, 6, 7, 8].indexOf(n) > -1;
}

// Based on github.com/component/rotate
function rotate(ctx, options){
  const x = options.x || 0;
  const y = options.y || 0;

  if (options.degrees) {
    options.radians = options.degrees * (Math.PI / 180);
  }

  ctx.translate(x, y);
  ctx.rotate(options.radians);
  ctx.translate(-x, -y);
}

// Based on github.com/component/flip
function flip(canvas, x, y){
  const ctx = canvas.getContext("2d");
  ctx.translate(
    x ? canvas.width : 0,
    y ? canvas.height : 0);
  ctx.scale(
    x ? -1 : 1,
    y ? -1 : 1);
}

const orientations = [
  { op: 'none', degrees: 0 },
  { op: 'flip-x', degrees: 0 },
  { op: 'none', degrees: 180 },
  { op: 'flip-y', degrees: 0 },
  { op: 'flip-x', degrees: 90 },
  { op: 'none', degrees: 90 },
  { op: 'flip-x', degrees: -90 },
  { op: 'none', degrees: -90 }
];

// Based on github.com/component/exif-rotate
export default orient;
function orient(img, orientationNumber) {
  const orientation = orientations[orientationNumber - 1];

  // canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  // dims
  if (rotated(orientationNumber)) {
    canvas.height = img.width;
    canvas.width = img.height;
  } else {
    canvas.width = img.width;
    canvas.height = img.height;
  }

  // flip
  if (orientation.op == 'flip-x') {
    flip(canvas, true, false);
  }
  if (orientation.op == 'flip-y') {
    flip(canvas, false, true);
  }

  // rotate
  if (orientation.degrees) {
    rotate(ctx, {
      degrees: orientation.degrees,
      x: canvas.width / 2,
      y: canvas.height / 2
    });

    if (rotated(orientationNumber)) {
      const d = canvas.width - canvas.height;
      ctx.translate(d / 2, -d / 2);
    }
  }

  ctx.drawImage(img, 0, 0);
  console.time("canvas to blob");
  return new Promise(function(resolve) {
    canvas.toBlob(resolve);
  })
  .then(function(blob) {
    console.timeEnd("canvas to blob");
    return window.URL.createObjectURL(blob);
  });
}
/* eslint-enable */
