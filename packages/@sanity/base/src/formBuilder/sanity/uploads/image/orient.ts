import {Observable} from 'rxjs'

/* eslint-disable */

/**
 * Check if we need to change dims.
 */
function rotated(n: number) {
  return [5, 6, 7, 8].indexOf(n) > -1
}

type RotateOpts = {
  degrees?: number
  x: number
  y: number
}

// Based on github.com/component/rotate
function rotate(ctx: CanvasRenderingContext2D | null, options: RotateOpts) {
  const x = options.x
  const y = options.y

  const radians = (options.degrees || 0) * (Math.PI / 180)

  ctx?.translate(x, y)
  ctx?.rotate(radians)
  ctx?.translate(-x, -y)
}

// Based on github.com/component/flip
function flip(canvas: HTMLCanvasElement, x: boolean, y: boolean) {
  const ctx = canvas.getContext('2d')
  ctx?.translate(x ? canvas.width : 0, y ? canvas.height : 0)
  ctx?.scale(x ? -1 : 1, y ? -1 : 1)
}

const ORIENTATION_OPS = [
  {op: 'none', degrees: 0},
  {op: 'flip-x', degrees: 0},
  {
    op: 'none',
    degrees: 180,
  },
  {op: 'flip-y', degrees: 0},
  {op: 'flip-x', degrees: 90},
  {op: 'none', degrees: 90},
  {
    op: 'flip-x',
    degrees: -90,
  },
  {op: 'none', degrees: -90},
]

export type Orientation =
  | 'top-left'
  | 'top-right'
  | 'bottom-right'
  | 'bottom-left'
  | 'left-top'
  | 'right-top'
  | 'right-bottom'
  | 'left-bottom'

const ORIENTATIONS: Array<Orientation> = [
  'top-left',
  'top-right',
  'bottom-right',
  'bottom-left',
  'left-top',
  'right-top',
  'right-bottom',
  'left-bottom',
]

export const DEFAULT_ORIENTATION: Orientation = 'top-left'

const THUMB_SIZE = 120

// Based on github.com/component/exif-rotate
function _orient(img: HTMLImageElement, orientationNumber: number): HTMLCanvasElement {
  const orientation = ORIENTATION_OPS[orientationNumber - 1]

  const ratio = img.height / img.width
  img.width = THUMB_SIZE / ratio
  img.height = img.width * ratio

  // canvas
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // dims
  if (rotated(orientationNumber)) {
    canvas.height = img.width
    canvas.width = img.height
  } else {
    canvas.width = img.width
    canvas.height = img.height
  }

  // flip
  if (orientation.op === 'flip-x') {
    flip(canvas, true, false)
  }
  if (orientation.op === 'flip-y') {
    flip(canvas, false, true)
  }

  // rotate
  if (orientation.degrees) {
    rotate(ctx, {
      degrees: orientation.degrees,
      x: canvas.width / 2,
      y: canvas.height / 2,
    })

    if (rotated(orientationNumber)) {
      const d = canvas.width - canvas.height
      ctx?.translate(d / 2, -d / 2)
    }
  }

  ctx?.drawImage(img, 0, 0, img.width, img.height)
  return canvas
}

/* eslint-enable */
export function orient(image: HTMLImageElement, orientationId: Orientation) {
  return new Observable((observer) => {
    // console.time('canvas to blob')
    const orientation = ORIENTATIONS.indexOf(orientationId) + 1
    const canvas = _orient(image, orientation)
    observer.next(canvas.toDataURL('image/jpeg', 0.1))
    observer.complete()
  })
}
