import {Rect} from './2d/shapes'
import * as utils2d from './2d/utils'

/** @internal */
export function paintBackground({
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

/** @internal */
export function paintHotspot({
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
