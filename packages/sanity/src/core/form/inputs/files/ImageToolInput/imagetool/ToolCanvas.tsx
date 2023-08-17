import React, {MouseEvent} from 'react'
import {memoize} from 'lodash'
import {getBackingStoreRatio} from './getBackingStoreRatio'
import * as utils2d from './2d/utils'
import {Rect} from './2d/shapes'
import {RootContainer, CanvasContainer} from './ToolCanvas.styles'

import * as cursors from './cursors'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from './constants'
import type {
  Coordinate,
  Crop,
  CropAndHotspot,
  CropHandles,
  Dimensions,
  Hotspot,
  Offsets,
  ToolCanvasProps,
  ToolCanvasState,
} from './types'

// The margin available in all directions for drawing the crop tool
const MARGIN_PX = 8
const CROP_HANDLE_SIZE = 12
const HOTSPOT_HANDLE_SIZE = 10

function normalizeRect(rect: Rect) {
  const flippedY = rect.top > rect.bottom
  const flippedX = rect.left > rect.right
  return {
    top: flippedY ? rect.bottom : rect.top,
    bottom: flippedY ? rect.top : rect.bottom,
    left: flippedX ? rect.right : rect.left,
    right: flippedX ? rect.left : rect.right,
  }
}

function checkCropBoundaries(value: Partial<CropAndHotspot>, delta: Offsets) {
  // Make the experience a little better. Still offsets when dragging back from outside
  if (
    !value ||
    !value.crop ||
    value.crop.top + delta.top < 0 ||
    value.crop.left + delta.left < 0 ||
    value.crop.right + delta.right < 0 ||
    value.crop.bottom + delta.bottom < 0
  ) {
    return false
  }
  return true
}

function limitToBoundaries(value: Partial<CropAndHotspot>, delta: Offsets) {
  const {top, right, bottom, left} = value.crop || DEFAULT_CROP

  const newValue = {
    hotspot: value.hotspot,
    crop: {
      top: top + (delta.top || 0) > 0 ? top : 0,
      right: right + (delta.right || 0) > 0 ? right : 0,
      bottom: bottom + (delta.bottom || 0) > 0 ? bottom : 0,
      left: left + (delta.left || 0) > 0 ? left : 0,
    },
  }

  const newDelta = {
    top: top + (delta.top || 0) > 0 ? delta.top || 0 : 0,
    right: right + (delta.right || 0) > 0 ? delta.right || 0 : 0,
    bottom: bottom + (delta.bottom || 0) > 0 ? delta.bottom || 0 : 0,
    left: left + (delta.left || 0) > 0 ? delta.left || 0 : 0,
  }

  return {value: newValue, delta: newDelta}
}

function getCropCursorForHandle(handle: keyof CropHandles | boolean) {
  switch (handle) {
    case 'left':
    case 'right':
      return 'col-resize'

    case 'top':
    case 'bottom':
      return 'row-resize'

    case 'topRight':
    case 'bottomLeft':
      return 'nesw-resize'

    case 'topLeft':
    case 'bottomRight':
      return 'nwse-resize'
    default:
      return null
  }
}

const getDevicePixelRatio = memoize(() => {
  const devicePixelRatio = window.devicePixelRatio || 1
  const ctx = document.createElement('canvas').getContext('2d')
  const backingStoreRatio = (ctx && getBackingStoreRatio(ctx)) || 1
  return devicePixelRatio / backingStoreRatio
})

const cropHandleKeys: (keyof CropHandles)[] = [
  'left',
  'right',
  'top',
  'topLeft',
  'topRight',
  'bottom',
  'bottomLeft',
  'bottomRight',
]

export class ToolCanvas extends React.PureComponent<ToolCanvasProps, ToolCanvasState> {
  state: ToolCanvasState = {
    cropping: false,
    cropMoving: false,
    moving: false,
    resizing: false,
    mousePosition: null,
  }

  canvas?: {domNode: HTMLCanvasElement}

  getHotspotRect() {
    const {value, image} = this.props

    const hotspot: Hotspot = value.hotspot || DEFAULT_HOTSPOT
    const hotspotRect = new Rect()
      .setSize(hotspot.width, hotspot.height)
      .setCenter(hotspot.x, hotspot.y)

    return new Rect()
      .setSize(image.width, image.height)
      .shrink(MARGIN_PX * this.getScale())
      .multiply(hotspotRect)
  }

  getCropRect() {
    const {value, image} = this.props

    return new Rect()
      .setSize(image.width, image.height)
      .shrink(MARGIN_PX * this.getScale())
      .cropRelative(Rect.fromEdges(value.crop || DEFAULT_CROP).clamp(new Rect(0, 0, 1, 1)))
  }

  getCropHandles(): CropHandles {
    const inner = this.getCropRect()

    const handleSize = CROP_HANDLE_SIZE * this.getScale()

    const halfCropHandleSize = handleSize / 2

    const cropHandle = new Rect(0, 0, handleSize, handleSize)
    return {
      left: cropHandle.setTopLeft(
        inner.left - halfCropHandleSize,
        inner.center.y - halfCropHandleSize,
      ),
      right: cropHandle.setTopLeft(
        inner.right - halfCropHandleSize,
        inner.center.y - halfCropHandleSize,
      ),

      top: cropHandle.setTopLeft(
        inner.center.x - halfCropHandleSize,
        inner.top - halfCropHandleSize,
      ),
      topLeft: cropHandle.setTopLeft(
        inner.left - halfCropHandleSize,
        inner.top - halfCropHandleSize,
      ),
      topRight: cropHandle.setTopLeft(
        inner.right - halfCropHandleSize,
        inner.top - halfCropHandleSize,
      ),

      bottom: cropHandle.setTopLeft(
        inner.center.x - halfCropHandleSize,
        inner.bottom - halfCropHandleSize,
      ),
      bottomLeft: cropHandle.setTopLeft(
        inner.left - halfCropHandleSize,
        inner.bottom - halfCropHandleSize,
      ),
      bottomRight: cropHandle.setTopLeft(
        inner.right - halfCropHandleSize,
        inner.bottom - halfCropHandleSize,
      ),
    }
  }

  getActiveCropHandleFor({x, y}: Coordinate) {
    const cropHandles = this.getCropHandles()
    for (const position of cropHandleKeys) {
      if (utils2d.isPointInRect({x, y}, cropHandles[position])) {
        return position
      }
    }
    return false
  }

  emitMove(pos: Coordinate) {
    const {image, value, onChange} = this.props
    const scale = this.getScale()
    const delta = {
      x: (pos.x * scale) / image.width,
      y: (pos.y * scale) / image.height,
    }

    onChange(applyHotspotMoveBy(value, delta))
  }

  emitCropMove(pos: Coordinate) {
    const {image, onChange, value} = this.props
    const scale = this.getScale()
    const left = (pos.x * scale) / image.width
    const right = (-pos.x * scale) / image.width
    const top = (pos.y * scale) / image.height
    const bottom = (-pos.y * scale) / image.height
    const delta = {left, right, top, bottom}

    if (checkCropBoundaries(value, delta)) {
      onChange(applyCropMoveBy(value, delta))
    }
  }

  emitCrop(side: string | boolean, pos: Coordinate) {
    const {image, onChange, value} = this.props
    const scale = this.getScale()
    let left = 0
    let right = 0
    let top = 0
    let bottom = 0

    if (side == 'left' || side === 'topLeft' || side === 'bottomLeft') {
      left = (pos.x * scale) / image.width
    } else if (side == 'right' || side === 'topRight' || side === 'bottomRight') {
      right = (-pos.x * scale) / image.width
    }

    if (side == 'top' || side === 'topLeft' || side === 'topRight') {
      top = (pos.y * scale) / image.height
    } else if (side == 'bottom' || side === 'bottomLeft' || side === 'bottomRight') {
      bottom = (-pos.y * scale) / image.height
    }

    const delta = {left, right, top, bottom}
    const newValue = limitToBoundaries(value, delta).value
    const newDelta = limitToBoundaries(value, delta).delta

    onChange(applyCropMoveBy(newValue, newDelta))
  }

  emitResize(pos: Coordinate) {
    const {image, onChange, value} = this.props
    const scale = this.getScale()

    const delta = {
      x: (pos.x * scale * 2) / image.width,
      y: (pos.y * scale * 2) / image.height,
    }
    onChange(applyHotspotResizeBy(value, {height: delta.y, width: delta.x}))
  }

  getClampedValue() {
    const value = this.props.value

    const crop = Rect.fromEdges(value.crop || DEFAULT_CROP).clamp(new Rect(0, 0, 1, 1))

    const hotspot = value.hotspot || DEFAULT_HOTSPOT
    const hotspotRect = new Rect(0, 0, 1, 1)
      .setSize(hotspot.width, hotspot.height)
      .setCenter(hotspot.x, hotspot.y)
      .clamp(crop)

    return {crop: crop, hotspot: hotspotRect}
  }

  paintHotspot(context: CanvasRenderingContext2D, opacity: number) {
    const {image, readOnly} = this.props

    const imageRect = new Rect().setSize(image.width, image.height)

    const {hotspot, crop} = this.getClampedValue()

    const scale = this.getScale()
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

  getActualSize() {
    const node = this.canvas?.domNode
    return node ? {height: node.clientHeight, width: node.clientWidth} : {height: 0, width: 0}
  }

  getDragHandleCoords() {
    const bbox = this.getHotspotRect()
    const point = utils2d.getPointAtCircumference(Math.PI * 1.25, bbox)
    return {
      x: point.x,
      y: point.y,
      radius: 8 * this.getScale(),
    }
  }

  debug(context: CanvasRenderingContext2D) {
    context.save()

    const {image} = this.props

    const bbox = this.getHotspotRect()
    const scale = this.getScale()
    const margin = MARGIN_PX * scale

    // IE 10 doesn't support context.setLineDash
    if (context.setLineDash) {
      context.setLineDash([2 * scale, 2 * scale])
    }
    context.lineWidth = 0.5 * scale

    context.strokeStyle = 'rgba(200, 200, 200, 0.5)'

    // --- center line x
    vline(bbox.center.x)
    // --- center line y
    hline(bbox.center.y)

    context.strokeStyle = 'rgba(150, 150, 150, 0.5)'
    // --- line top
    hline(bbox.top)

    // --- line bottom
    hline(bbox.bottom)

    // --- line left
    vline(bbox.left)
    // --- line right
    vline(bbox.right)

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

  paintBackground(context: CanvasRenderingContext2D) {
    const {image} = this.props
    const inner = new Rect().setSize(image.width, image.height).shrink(MARGIN_PX * this.getScale())

    context.save()
    context.fillStyle = 'white'
    context.clearRect(0, 0, image.width, image.height)

    context.globalAlpha = 0.3
    //context.globalCompositeOperation = 'lighten';

    context.drawImage(image, inner.left, inner.top, inner.width, inner.height)
    context.restore()
  }

  paint(context: CanvasRenderingContext2D) {
    const {readOnly} = this.props
    context.save()

    const pxratio = getDevicePixelRatio()
    context.scale(pxratio, pxratio)

    const opacity = !readOnly && this.state.mousePosition ? 0.8 : 0.2

    this.paintBackground(context)
    //return context.restore();
    this.paintHotspot(context, opacity)
    //this.paintDragHandle(context);
    this.debug(context)
    this.paintCropBorder(context)

    if (!readOnly) {
      this.highlightCropHandles(context, opacity)
    }

    if (this.state.mousePosition) {
      // this.paintMousePosition(context)
    }

    context.restore()
  }

  paintMousePosition(context: CanvasRenderingContext2D) {
    if (!this.state.mousePosition) {
      return
    }

    const {x, y} = this.state.mousePosition
    context.beginPath()
    context.arc(x, y, 14 * this.getScale(), 0, 2 * Math.PI, false)
    context.fillStyle = 'lightblue'
    context.fill()
    context.restore()
  }

  paintCropBorder(context: CanvasRenderingContext2D) {
    const cropRect = this.getCropRect()
    context.save()
    context.beginPath()
    context.fillStyle = 'rgba(66, 66, 66, 0.9)'
    context.lineWidth = 1
    context.rect(cropRect.left, cropRect.top, cropRect.width, cropRect.height)
    context.stroke()
    context.closePath()
    context.restore()
  }

  highlightCropHandles(context: CanvasRenderingContext2D, opacity: number) {
    context.save()
    const cropHandles = this.getCropHandles()

    //context.globalCompositeOperation = "difference";

    cropHandleKeys.forEach((handle) => {
      context.fillStyle =
        this.state.cropping === handle
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

  getScale() {
    const actualSize = this.getActualSize()
    return this.props.image.width / actualSize.width
  }

  getCursor() {
    const {mousePosition} = this.state
    const {readOnly} = this.props
    if (!mousePosition || readOnly) {
      return 'auto'
    }

    const activeCropArea = this.state.cropping || this.getActiveCropHandleFor(mousePosition)
    if (activeCropArea) {
      return getCropCursorForHandle(activeCropArea) || 'auto'
    }

    const mouseOverDragHandle = utils2d.isPointInCircle(mousePosition, this.getDragHandleCoords())

    if (this.state.resizing || mouseOverDragHandle) {
      return 'move'
    }

    if (this.state.moving || this.state.cropMoving) {
      return `url(${cursors.CLOSE_HAND}), move`
    }

    const mouseoverHotspot = utils2d.isPointInEllipse(mousePosition, this.getHotspotRect())
    const mouseoverCropRect = utils2d.isPointInRect(mousePosition, this.getCropRect())
    if (mouseoverHotspot || mouseoverCropRect) {
      return `url(${cursors.OPEN_HAND}), move`
    }

    return 'auto'
  }

  componentDidMount() {
    this.draw()
  }

  componentDidUpdate() {
    this.draw()
  }

  draw() {
    if (!this.canvas) {
      return
    }

    const domNode = this.canvas.domNode
    const context = domNode.getContext('2d')
    if (!context) {
      return
    }

    this.paint(context)
    const currentCursor = domNode.style.cursor
    const newCursor = this.getCursor()
    if (currentCursor !== newCursor) {
      domNode.style.cursor = newCursor
    }
  }

  handleDragStart = ({x, y}: Coordinate) => {
    const mousePosition = {x: x * this.getScale(), y: y * this.getScale()}

    const inHotspot = utils2d.isPointInEllipse(mousePosition, this.getHotspotRect())

    const inDragHandle = utils2d.isPointInCircle(mousePosition, this.getDragHandleCoords())

    const activeCropHandle = this.getActiveCropHandleFor(mousePosition)

    const inCropRect = utils2d.isPointInRect(mousePosition, this.getCropRect())

    if (activeCropHandle) {
      this.setState({cropping: activeCropHandle})
    } else if (inDragHandle) {
      this.setState({resizing: true})
    } else if (inHotspot) {
      this.setState({moving: true})
    } else if (inCropRect) {
      this.setState({cropMoving: true})
    }
  }

  handleDrag = (pos: Coordinate) => {
    if (this.state.cropping) {
      this.emitCrop(this.state.cropping, pos)
    } else if (this.state.cropMoving) {
      this.emitCropMove(pos)
    } else if (this.state.moving) {
      this.emitMove(pos)
    } else if (this.state.resizing) {
      this.emitResize(pos)
    }
  }

  handleDragEnd = () => {
    const {onChange, onChangeEnd} = this.props
    this.setState({moving: false, resizing: false, cropping: false, cropMoving: false})
    const {hotspot, crop: rawCrop} = this.getClampedValue()

    const crop = normalizeRect(rawCrop)

    const finalValue = {
      crop: {
        top: crop.top,
        bottom: 1 - crop.bottom,
        left: crop.left,
        right: 1 - crop.right,
      },
      hotspot: {
        x: hotspot.center.x,
        y: hotspot.center.y,
        height: Math.abs(hotspot.height),
        width: Math.abs(hotspot.width),
      },
    }
    onChange(finalValue)
    if (onChangeEnd) {
      onChangeEnd(finalValue)
    }
  }

  handleMouseOut = () => {
    this.setState({mousePosition: null})
  }

  handleMouseMove = (event: MouseEvent<HTMLCanvasElement>) => {
    const clientRect = event.currentTarget.getBoundingClientRect()
    this.setState({
      mousePosition: {
        x: (event.clientX - clientRect.left) * this.getScale(),
        y: (event.clientY - clientRect.top) * this.getScale(),
      },
    })
  }

  setCanvas = (node: {domNode: HTMLCanvasElement}) => {
    this.canvas = node
  }

  render() {
    const {image, readOnly} = this.props
    const ratio = getDevicePixelRatio()
    return (
      <RootContainer>
        <CanvasContainer
          readOnly={readOnly}
          ref={this.setCanvas}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onMouseMove={this.handleMouseMove}
          onMouseOut={this.handleMouseOut}
          height={image.height * ratio}
          width={image.width * ratio}
        />
      </RootContainer>
    )
  }
}

function applyHotspotMoveBy(value: Partial<CropAndHotspot>, delta: Coordinate): {hotspot: Hotspot} {
  const currentHotspot = (value && value.hotspot) || DEFAULT_HOTSPOT

  return {
    ...value,
    hotspot: {
      ...currentHotspot,
      x: currentHotspot.x + delta.x,
      y: currentHotspot.y + delta.y,
    },
  }
}

function applyHotspotResizeBy(
  value: Partial<CropAndHotspot>,
  delta: Dimensions,
): {hotspot: Hotspot} {
  const currentHotspot = (value && value.hotspot) || DEFAULT_HOTSPOT
  return {
    ...value,
    hotspot: {
      ...currentHotspot,
      height: currentHotspot.height + delta.height,
      width: currentHotspot.width + delta.width,
    },
  }
}

function applyCropMoveBy(value: Partial<CropAndHotspot>, delta: Offsets): {crop: Crop} {
  const currentCrop = (value && value.crop) || DEFAULT_CROP
  return {
    ...value,
    crop: {
      left: currentCrop.left + (delta.left || 0),
      right: currentCrop.right + (delta.right || 0),
      top: currentCrop.top + (delta.top || 0),
      bottom: currentCrop.bottom + (delta.bottom || 0),
    },
  }
}
