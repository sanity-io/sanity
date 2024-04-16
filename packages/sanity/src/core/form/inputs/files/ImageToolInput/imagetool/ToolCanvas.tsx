import {memo, type PointerEvent, PureComponent, useMemo} from 'react'
import {useDevicePixelRatio} from 'use-device-pixel-ratio'

import {Rect} from './2d/shapes'
import * as utils2d from './2d/utils'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from './constants'
import * as cursors from './cursors'
import {DragAwareCanvas} from './DragAwareCanvas'
import {cropHandleKeys, paint} from './draw'
import {RootContainer} from './ToolCanvas.styles'
import {
  type Coordinate,
  type Crop,
  type CropAndHotspot,
  type CropHandles,
  type Dimensions,
  type Hotspot,
  type Offsets,
  type ToolCanvasProps,
} from './types'
import {useActualCanvasSizeObserver} from './useActualCanvasSizeObserver'

interface ToolCanvasState {
  cropping: keyof CropHandles | false
  resizing: boolean
  moving: boolean
  cropMoving: boolean
  pointerPosition: Coordinate | null
}

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

function ToolCanvasComponent(props: ToolCanvasProps) {
  const {image, readOnly, onChange, onChangeEnd, value} = props

  const ratio = useDevicePixelRatio()
  const [actualSize, setCanvasObserver] = useActualCanvasSizeObserver()
  const scale = useMemo(() => image.width / actualSize.width, [actualSize.width, image.width])
  const hotspotRect = useMemo(() => {
    const hotspot: Hotspot = value.hotspot || DEFAULT_HOTSPOT
    const rect = new Rect().setSize(hotspot.width, hotspot.height).setCenter(hotspot.x, hotspot.y)

    return new Rect()
      .setSize(image.width, image.height)
      .shrink(MARGIN_PX * scale)
      .multiply(rect)
  }, [image.height, image.width, scale, value.hotspot])
  const cropRect = useMemo(() => {
    return new Rect()
      .setSize(image.width, image.height)
      .shrink(MARGIN_PX * scale)
      .cropRelative(Rect.fromEdges(value.crop || DEFAULT_CROP).clamp(new Rect(0, 0, 1, 1)))
  }, [image.height, image.width, scale, value.crop])
  const cropHandles = useMemo(() => {
    const inner = cropRect

    const handleSize = CROP_HANDLE_SIZE * scale

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
  }, [cropRect, scale])
  const clampedValue = useMemo(() => {
    const crop = Rect.fromEdges(value.crop || DEFAULT_CROP).clamp(new Rect(0, 0, 1, 1))

    const hotspot = value.hotspot || DEFAULT_HOTSPOT
    // eslint-disable-next-line @typescript-eslint/no-shadow
    const hotspotRect = new Rect(0, 0, 1, 1)
      .setSize(hotspot.width, hotspot.height)
      .setCenter(hotspot.x, hotspot.y)
      .clamp(crop)

    return {crop: crop, hotspot: hotspotRect}
  }, [value.crop, value.hotspot])

  return (
    <ToolCanvasLegacy
      actualSize={actualSize}
      hotspotRect={hotspotRect}
      cropRect={cropRect}
      cropHandles={cropHandles}
      clampedValue={clampedValue}
      image={image}
      onChange={onChange}
      onChangeEnd={onChangeEnd}
      ratio={ratio}
      readOnly={readOnly}
      scale={scale}
      setCanvasObserver={setCanvasObserver}
      value={value}
    />
  )
}
export const ToolCanvas = memo(ToolCanvasComponent)

class ToolCanvasLegacy extends PureComponent<
  ToolCanvasProps & {
    ratio: number
    actualSize: Dimensions
    scale: number
    setCanvasObserver: React.Dispatch<React.SetStateAction<HTMLCanvasElement | null>>
    hotspotRect: Rect
    cropRect: Rect
    cropHandles: CropHandles
    clampedValue: {crop: Rect; hotspot: Rect}
  },
  ToolCanvasState
> {
  state: ToolCanvasState = {
    cropping: false,
    cropMoving: false,
    moving: false,
    resizing: false,
    pointerPosition: null,
  }

  canvas?: HTMLCanvasElement

  getActiveCropHandleFor({x, y}: Coordinate) {
    const cropHandles = this.props.cropHandles
    for (const position of cropHandleKeys) {
      if (utils2d.isPointInRect({x, y}, cropHandles[position])) {
        return position
      }
    }
    return false
  }

  emitMove(pos: Coordinate) {
    const {image, value, onChange} = this.props
    const scale = this.props.scale
    const delta = {
      x: (pos.x * scale) / image.width,
      y: (pos.y * scale) / image.height,
    }

    onChange(applyHotspotMoveBy(value, delta))
  }

  emitCropMove(pos: Coordinate) {
    const {image, onChange, value} = this.props
    const scale = this.props.scale
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
    const scale = this.props.scale
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
    const scale = this.props.scale

    const delta = {
      x: (pos.x * scale * 2) / image.width,
      y: (pos.y * scale * 2) / image.height,
    }
    onChange(applyHotspotResizeBy(value, {height: delta.y, width: delta.x}))
  }

  getDragHandleCoords() {
    const bbox = this.props.hotspotRect
    const point = utils2d.getPointAtCircumference(Math.PI * 1.25, bbox)
    return {
      x: point.x,
      y: point.y,
      radius: 8 * this.props.scale,
    }
  }

  getCursor() {
    const {pointerPosition} = this.state
    const {readOnly} = this.props
    if (!pointerPosition || readOnly) {
      return 'auto'
    }

    const activeCropArea = this.state.cropping || this.getActiveCropHandleFor(pointerPosition)
    if (activeCropArea) {
      return getCropCursorForHandle(activeCropArea) || 'auto'
    }

    const pointerOverDragHandle = utils2d.isPointInCircle(
      pointerPosition,
      this.getDragHandleCoords(),
    )

    if (this.state.resizing || pointerOverDragHandle) {
      return 'move'
    }

    if (this.state.moving || this.state.cropMoving) {
      return `url(${cursors.CLOSE_HAND}), move`
    }

    const pointerOverHotspot = utils2d.isPointInEllipse(pointerPosition, this.props.hotspotRect)
    const pointerOverCropRect = utils2d.isPointInRect(pointerPosition, this.props.cropRect)
    if (pointerOverHotspot || pointerOverCropRect) {
      return `url(${cursors.OPEN_HAND}), move`
    }

    return 'auto'
  }

  componentDidMount() {
    const {canvas} = this
    if (canvas) {
      this.draw({canvas})
    }
  }

  componentDidUpdate() {
    const {canvas} = this
    if (canvas) {
      this.draw({canvas})
    }
  }

  draw({canvas}: {canvas: HTMLCanvasElement}) {
    const context = canvas.getContext('2d')
    if (!context) {
      return
    }

    const {clampedValue, cropHandles, cropRect, hotspotRect, image, ratio, readOnly, scale} =
      this.props
    const {cropping, pointerPosition} = this.state
    paint({
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
    })
    const currentCursor = canvas.style.cursor
    const newCursor = this.getCursor()
    if (currentCursor !== newCursor) {
      canvas.style.cursor = newCursor
    }
  }

  handleDragStart = ({x, y}: Coordinate) => {
    const pointerPosition = {x: x * this.props.scale, y: y * this.props.scale}

    const inHotspot = utils2d.isPointInEllipse(pointerPosition, this.props.hotspotRect)

    const inDragHandle = utils2d.isPointInCircle(pointerPosition, this.getDragHandleCoords())

    const activeCropHandle = this.getActiveCropHandleFor(pointerPosition)

    const inCropRect = utils2d.isPointInRect(pointerPosition, this.props.cropRect)

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
    const {hotspot, crop: rawCrop} = this.props.clampedValue

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

  handlePointerOut = () => {
    this.setState({pointerPosition: null})
  }

  handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const clientRect = event.currentTarget.getBoundingClientRect()
    this.setState({
      pointerPosition: {
        x: (event.clientX - clientRect.left) * this.props.scale,
        y: (event.clientY - clientRect.top) * this.props.scale,
      },
    })
  }

  setCanvas = (node: HTMLCanvasElement | null) => {
    if (node) {
      this.canvas = node
    }
    this.props.setCanvasObserver(node)
  }

  render() {
    const {image, readOnly, ratio} = this.props
    return (
      <RootContainer>
        <DragAwareCanvas
          readOnly={readOnly}
          ref={this.setCanvas}
          onDrag={this.handleDrag}
          onDragStart={this.handleDragStart}
          onDragEnd={this.handleDragEnd}
          onPointerMove={this.handlePointerMove}
          onPointerOut={this.handlePointerOut}
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
