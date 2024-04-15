import {Rect} from './2d/shapes'

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
