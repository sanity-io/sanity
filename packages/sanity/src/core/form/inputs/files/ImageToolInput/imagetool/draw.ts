import {Rect} from './2d/shapes'
import * as utils2d from './2d/utils'
import {type Coordinate, type CropHandles} from './types'

function paintBackground({
  context,
  image,
  MARGIN_PX,
  scale,
}: {
  context: CanvasRenderingContext2D
  image: HTMLCanvasElement
  MARGIN_PX: number
  scale: number
}): void {
  const inner = new Rect().setSize(image.width, image.height).shrink(MARGIN_PX * scale)

  context.save()
  context.fillStyle = 'white'
  context.clearRect(0, 0, image.width, image.height)

  context.globalAlpha = 0.3
  //context.globalCompositeOperation = 'lighten';

  context.drawImage(image, inner.left, inner.top, inner.width, inner.height)
  context.restore()
}

function paintHotspot({
  clampedValue,
  context,
  HOTSPOT_HANDLE_SIZE,
  image,
  MARGIN_PX,
  opacity,
  readOnly,
  scale,
}: {
  clampedValue: {crop: Rect; hotspot: Rect}
  context: CanvasRenderingContext2D
  HOTSPOT_HANDLE_SIZE: number
  image: HTMLCanvasElement
  MARGIN_PX: number
  opacity: number
  readOnly: boolean
  scale: number
}): void {
  const imageRect = new Rect().setSize(image.width, image.height)

  const {hotspot, crop} = clampedValue

  const margin = MARGIN_PX * scale

  context.save()
  drawBackdrop()
  drawEllipse()
  context.clip()
  drawHole()
  context.restore()
  if (!readOnly) {
    drawDragHandle(Math.PI * 1.25)
  }

  function drawEllipse() {
    context.save()

    const dest = imageRect.shrink(margin).multiply(hotspot)

    const scaleY = dest.height / dest.width

    context.scale(1, scaleY)
    context.beginPath()
    context.globalAlpha = opacity
    context.arc(
      dest.center.x,
      dest.center.y / scaleY,
      Math.abs(dest.width / 2),
      0,
      2 * Math.PI,
      false,
    )
    context.strokeStyle = 'white'
    context.lineWidth = 1.5 * scale
    context.stroke()
    context.closePath()

    context.restore()
  }

  // eslint-disable-next-line max-params
  function drawImage(
    srcLeft: number,
    srcTop: number,
    srcWidth: number,
    srcHeight: number,
    destLeft: number,
    destTop: number,
    destWidth: number,
    destHeight: number,
  ) {
    context.save()
    context.drawImage(
      image,
      srcLeft,
      srcTop,
      srcWidth,
      srcHeight,
      destLeft,
      destTop,
      destWidth,
      destHeight,
    )
    context.restore()
  }

  function drawHole() {
    const src = imageRect.multiply(hotspot)

    const dest = imageRect.shrink(margin).multiply(hotspot)

    drawImage(
      src.left,
      src.top,
      src.width,
      src.height,
      dest.left,
      dest.top,
      dest.width,
      dest.height,
    )
  }

  function drawBackdrop() {
    const src = imageRect.cropRelative(crop)

    const dest = imageRect.shrink(margin).cropRelative(crop)

    context.save()
    drawImage(
      src.left,
      src.top,
      src.width,
      src.height,
      dest.left,
      dest.top,
      dest.width,
      dest.height,
    )
    context.globalAlpha = 0.5
    context.fillStyle = 'black'
    context.fillRect(dest.left, dest.top, dest.width, dest.height)
    context.restore()
  }

  function drawDragHandle(radians: number) {
    context.save()

    const radius = HOTSPOT_HANDLE_SIZE * scale
    const dest = imageRect.shrink(margin).multiply(hotspot)

    const point = utils2d.getPointAtCircumference(radians, dest)

    context.beginPath()
    context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
    context.fillStyle = 'rgb(255,255,255)'
    context.fill()
    context.closePath()
    context.restore()

    context.beginPath()
    context.arc(point.x, point.y, radius, 0, 2 * Math.PI, false)
    context.strokeStyle = 'rgb(0, 0, 0)'
    context.lineWidth = 0.5 * scale
    context.stroke()
    context.closePath()
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function paintPointerPosition({
  context,
  pointerPosition,
  scale,
}: {
  context: CanvasRenderingContext2D
  pointerPosition: Coordinate | null
  scale: number
}): void {
  if (!pointerPosition) {
    return
  }

  const {x, y} = pointerPosition
  context.beginPath()
  context.arc(x, y, 14 * scale, 0, 2 * Math.PI, false)
  context.fillStyle = 'lightblue'
  context.fill()
  context.restore()
}

function printGuidelines({
  context,
  hotspotRect,
  image,
  MARGIN_PX,
  scale,
}: {
  context: CanvasRenderingContext2D
  hotspotRect: Rect
  image: HTMLCanvasElement
  MARGIN_PX: number
  scale: number
}): void {
  context.save()

  const margin = MARGIN_PX * scale

  // IE 10 doesn't support context.setLineDash
  if (context.setLineDash) {
    context.setLineDash([2 * scale, 2 * scale])
  }
  context.lineWidth = 0.5 * scale

  context.strokeStyle = 'rgba(200, 200, 200, 0.5)'

  // --- center line x
  vline(hotspotRect.center.x)
  // --- center line y
  hline(hotspotRect.center.y)

  context.strokeStyle = 'rgba(150, 150, 150, 0.5)'
  // --- line top
  hline(hotspotRect.top)

  // --- line bottom
  hline(hotspotRect.bottom)

  // --- line left
  vline(hotspotRect.left)
  // --- line right
  vline(hotspotRect.right)

  context.restore()

  function vline(x: number) {
    line(x, margin, x, image.height - margin)
  }

  function hline(y: number) {
    line(margin, y, image.width - margin, y)
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.closePath()
  }
}

function paintCropBorder({
  context,
  cropRect,
}: {
  context: CanvasRenderingContext2D
  cropRect: Rect
}): void {
  context.save()
  context.beginPath()
  context.fillStyle = 'rgba(66, 66, 66, 0.9)'
  context.lineWidth = 1
  context.rect(cropRect.left, cropRect.top, cropRect.width, cropRect.height)
  context.stroke()
  context.closePath()
  context.restore()
}

function highlightCropHandles({
  context,
  cropHandles,
  cropping,
  opacity,
}: {
  context: CanvasRenderingContext2D
  cropHandles: CropHandles
  cropping: keyof CropHandles | false
  opacity: number
}): void {
  context.save()

  //context.globalCompositeOperation = "difference";

  cropHandleKeys.forEach((handle) => {
    context.fillStyle =
      cropping === handle
        ? `rgba(202, 54, 53, ${opacity})`
        : `rgba(230, 230, 230, ${opacity + 0.4})`
    const {left, top, height, width} = cropHandles[handle]
    context.fillRect(left, top, width, height)
    context.beginPath()
    context.fillStyle = `rgba(66, 66, 66, ${opacity})`
    context.rect(left, top, width, height)
    context.closePath()
    context.stroke()
  })
  context.restore()
}

/** @internal */
export const cropHandleKeys: (keyof CropHandles)[] = [
  'left',
  'right',
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
]

/** @internal */
export function paint({
  clampedValue,
  context,
  cropHandles,
  cropping,
  cropRect,
  HOTSPOT_HANDLE_SIZE,
  hotspotRect,
  image,
  MARGIN_PX,
  pointerPosition,
  ratio,
  readOnly,
  scale,
}: {
  clampedValue: {crop: Rect; hotspot: Rect}
  context: CanvasRenderingContext2D
  cropHandles: CropHandles
  cropping: keyof CropHandles | false
  cropRect: Rect
  HOTSPOT_HANDLE_SIZE: number
  hotspotRect: Rect
  image: HTMLCanvasElement
  MARGIN_PX: number
  pointerPosition: Coordinate | null
  ratio: number
  readOnly: boolean
  scale: number
}): void {
  context.save()

  context.scale(ratio, ratio)

  const opacity = !readOnly && pointerPosition ? 0.8 : 0.2

  paintBackground({context, image, MARGIN_PX, scale})
  paintHotspot({
    clampedValue,
    context,
    HOTSPOT_HANDLE_SIZE,
    image,
    MARGIN_PX,
    opacity,
    readOnly,
    scale,
  })
  printGuidelines({context, hotspotRect, image, MARGIN_PX, scale})
  paintCropBorder({context, cropRect})

  if (!readOnly) {
    highlightCropHandles({context, cropHandles, cropping, opacity})
  }

  // paintPointerPosition({context, pointerPosition, scale})

  context.restore()
}
