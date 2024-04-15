import {memoize} from 'lodash'
import {
  memo,
  type PointerEvent,
  startTransition,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import {resizeObserver} from '../../../../../util/resizeObserver'
import {Rect} from './2d/shapes'
import * as utils2d from './2d/utils'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from './constants'
import * as cursors from './cursors'
import {DragAwareCanvas} from './DragAwareCanvas'
import {getBackingStoreRatio} from './getBackingStoreRatio'
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

// The margin available in all directions for drawing the crop tool
const MARGIN_PX = 8
const CROP_HANDLE_SIZE = 12
const HOTSPOT_HANDLE_SIZE = 10

function ToolCanvasComponent(props: ToolCanvasProps) {
  const {
    image: imageProp,
    readOnly,
    onChange: onChangeProp,
    onChangeEnd: onChangeEndProp,
    value: valueProp,
  } = props
  const image = useEffectRef(props.image)
  const onChange = useEffectRef(props.onChange)

  const canvas = useRef<HTMLCanvasElement | null>(null)
  const [canvasClientHeight, setCanvasClientHeight] = useState(0)
  const [canvasClientWidth, setCanvasClientWidth] = useState(0)
  const actualSize = useMemo(
    () => ({height: canvasClientHeight, width: canvasClientWidth}),
    [canvasClientHeight, canvasClientWidth],
  )
  const imageSize = useMemo(
    () => ({height: props.image.height, width: props.image.width}),
    [props.image.height, props.image.width],
  )
  const scaleMemo = useMemo(
    () => imageSize.width / actualSize.width,
    [actualSize.width, imageSize.width],
  )
  const scale = useEffectRef(scaleMemo)
  const clampedValue = useMemo(() => {
    console.count('clampedValue')
    const crop = Rect.fromEdges(valueProp.crop || DEFAULT_CROP).clamp(new Rect(0, 0, 1, 1))

    const hotspot = valueProp.hotspot || DEFAULT_HOTSPOT
    const hotspotRect = new Rect(0, 0, 1, 1)
      .setSize(hotspot.width, hotspot.height)
      .setCenter(hotspot.x, hotspot.y)
      .clamp(crop)

    return {crop: crop, hotspot: hotspotRect}
  }, [valueProp.crop, valueProp.hotspot])

  const [croppingState, setCropping] = useState<keyof CropHandles | false>(false)
  const [cropMovingState, setCropMoving] = useState(false)
  const [movingState, setMoving] = useState(false)
  const [resizingState, setResizing] = useState(false)
  const pointerPosition = useRef<Coordinate | null>(null)

  useEffect(() => {
    const node = canvas.current
    if (!node) {
      return undefined
    }

    startTransition(() => {
      setCanvasClientHeight(node.clientHeight)
      setCanvasClientWidth(node.clientWidth)
    })
    resizeObserver.observe(node, (entry) => {
      startTransition(() => {
        setCanvasClientHeight(Math.ceil(entry.contentRect.height))
        setCanvasClientWidth(Math.ceil(entry.contentRect.width))
      })
    })
    return () => {
      resizeObserver.unobserve(node)
    }
  }, [])

  const emitMove = useCallback(
    (pos: Coordinate) => {
      const delta = {
        x: (pos.x * scaleMemo) / imageProp.width,
        y: (pos.y * scaleMemo) / imageProp.height,
      }

      onChange.current(applyHotspotMoveBy(valueProp, delta))
    },
    [scaleMemo, imageProp.height, imageProp.width, valueProp, onChange],
  )
  const emitCropMove = useCallback(
    (pos: Coordinate) => {
      const left = (pos.x * scaleMemo) / imageProp.width
      const right = (-pos.x * scaleMemo) / imageProp.width
      const top = (pos.y * scaleMemo) / imageProp.height
      const bottom = (-pos.y * scaleMemo) / imageProp.height
      const delta = {left, right, top, bottom}

      if (checkCropBoundaries(valueProp, delta)) {
        onChange.current(applyCropMoveBy(valueProp, delta))
      }
    },
    [scaleMemo, imageProp.height, imageProp.width, onChange, valueProp],
  )
  const emitCrop = useCallback(
    (side: string | boolean, pos: Coordinate) => {
      let left = 0
      let right = 0
      let top = 0
      let bottom = 0

      if (side == 'left' || side === 'topLeft' || side === 'bottomLeft') {
        left = (pos.x * scaleMemo) / imageProp.width
      } else if (side == 'right' || side === 'topRight' || side === 'bottomRight') {
        right = (-pos.x * scaleMemo) / imageProp.width
      }

      if (side == 'top' || side === 'topLeft' || side === 'topRight') {
        top = (pos.y * scaleMemo) / imageProp.height
      } else if (side == 'bottom' || side === 'bottomLeft' || side === 'bottomRight') {
        bottom = (-pos.y * scaleMemo) / imageProp.height
      }

      const delta = {left, right, top, bottom}
      const newValue = limitToBoundaries(valueProp, delta).value
      const newDelta = limitToBoundaries(valueProp, delta).delta

      onChangeProp(applyCropMoveBy(newValue, newDelta))
    },
    [scaleMemo, imageProp.height, imageProp.width, onChangeProp, valueProp],
  )
  const emitResize = useCallback(
    (pos: Coordinate) => {
      const delta = {
        x: (pos.x * scaleMemo * 2) / imageProp.width,
        y: (pos.y * scaleMemo * 2) / imageProp.height,
      }
      onChangeProp(applyHotspotResizeBy(valueProp, {height: delta.y, width: delta.x}))
    },
    [scaleMemo, imageProp.height, imageProp.width, onChangeProp, valueProp],
  )

  useEffect(() => {
    // @TODO add checks for wether dragging is happening or not, and other events
    if (canvas.current) {
      draw({
        canvas: canvas.current,
        clampedValue,
        crop: valueProp.crop,
        cropMoving: cropMovingState,
        cropping: croppingState,
        hotspot: valueProp.hotspot,
        image: imageProp,
        imageSize,
        moving: movingState,
        pointerPosition: pointerPosition.current,
        readOnly: readOnly,
        resizing: resizingState,
        scale: scaleMemo,
      })
    }
  }, [
    clampedValue,
    cropMovingState,
    croppingState,
    imageProp,
    imageSize,
    movingState,
    readOnly,
    resizingState,
    scaleMemo,
    valueProp.crop,
    valueProp.hotspot,
  ])

  const handleDragStart = useCallback(
    ({x, y}: Coordinate) => {
      // eslint-disable-next-line @typescript-eslint/no-shadow
      const pointerPosition = {x: x * scaleMemo, y: y * scaleMemo}

      const inHotspot = utils2d.isPointInEllipse(
        pointerPosition,
        getHotspotRect({hotspot: valueProp.hotspot, imageSize, scale: scaleMemo}),
      )

      const inDragHandle = utils2d.isPointInCircle(
        pointerPosition,
        getDragHandleCoords({
          hotspot: valueProp.hotspot,
          imageSize,
          scale: scaleMemo,
        }),
      )

      const activeCropHandle = getActiveCropHandleFor({
        crop: valueProp.crop,
        imageSize,
        pointerPosition,
        scale: scaleMemo,
      })

      const inCropRect = utils2d.isPointInRect(
        pointerPosition,
        getCropRect({
          crop: valueProp.crop,
          imageSize,
          scale: scaleMemo,
        }),
      )

      if (activeCropHandle) {
        setCropping(activeCropHandle)
      } else if (inDragHandle) {
        setResizing(true)
      } else if (inHotspot) {
        setMoving(true)
      } else if (inCropRect) {
        setCropMoving(true)
      }
    },
    [imageSize, scaleMemo, valueProp.crop, valueProp.hotspot],
  )
  const handleDrag = useMemo(() => {
    console.count('handleDrag changed')
    return (pos: Coordinate) => {
      if (croppingState) {
        emitCrop(croppingState, pos)
      } else if (cropMovingState) {
        emitCropMove(pos)
      } else if (movingState) {
        emitMove(pos)
      } else if (resizingState) {
        emitResize(pos)
      }
    }
  }, [
    cropMovingState,
    croppingState,
    emitCrop,
    emitCropMove,
    emitMove,
    emitResize,
    movingState,
    resizingState,
  ])
  const handleDragEnd = useCallback(() => {
    console.log('handleDragEnd changes too much')
    setMoving(false)
    setResizing(false)
    setCropping(false)
    setCropMoving(false)
    const {hotspot, crop: rawCrop} = clampedValue

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
    onChangeProp(finalValue)
    if (onChangeEndProp) {
      onChangeEndProp(finalValue)
    }
  }, [clampedValue, onChangeProp, onChangeEndProp])
  const handlePointerOut = useCallback(() => {
    pointerPosition.current = null
  }, [])
  const handlePointerMove = useCallback(
    (event: PointerEvent<HTMLCanvasElement>) => {
      const clientRect = event.currentTarget.getBoundingClientRect()
      pointerPosition.current = {
        x: (event.clientX - clientRect.left) * scaleMemo,
        y: (event.clientY - clientRect.top) * scaleMemo,
      }
    },
    [scaleMemo],
  )

  const ratio = useDevicePixelRatio()

  return (
    <RootContainer>
      <DragAwareCanvas
        readOnly={readOnly}
        ref={canvas}
        onDrag={handleDrag}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onPointerMove={handlePointerMove}
        onPointerOut={handlePointerOut}
        height={imageProp.height * ratio}
        width={imageProp.width * ratio}
        // @TODO tracking deps that change too often
        clampedValue={clampedValue}
        cropMoving={cropMovingState}
        cropping={croppingState}
        emitCrop={emitCrop}
        emitCropMove={emitCropMove}
        emitMove={emitMove}
        emitResize={emitResize}
        moving={movingState}
        resizing={resizingState}
        getActiveCropHandleFor={getActiveCropHandleFor}
        getCropRect={getCropRect}
        getDragHandleCoords={getDragHandleCoords}
        getHotspotRect={getHotspotRect}
        scale={scaleMemo}
        onChange={onChangeProp}
        onChangeEnd={onChangeEndProp}
      />
    </RootContainer>
  )
}

function useEffectRef<const T>(value: T) {
  const ref = useRef<T>(value)
  useEffect(() => {
    ref.current = value
  }, [value])
  return ref
}

export const ToolCanvas = memo(ToolCanvasComponent, function arePropsEqual(oldProps, newProps) {
  const keys = new Set([...Object.keys(oldProps), ...Object.keys(newProps)])
  for (const key of keys) {
    if (!Object.is(oldProps[key], newProps[key])) {
      console.count(`ToolCanvas ${key} changed`)
      return false
    }
  }
  return true
})

/**
 * Hot path, tries to render 60fps
 */
function draw({
  canvas,
  readOnly,
  pointerPosition,
  cropping,
  crop,
  imageSize,
  scale,
  cropMoving,
  hotspot,
  resizing,
  moving,
  image,
  clampedValue,
}: {
  canvas: HTMLCanvasElement
  readOnly: boolean
  pointerPosition: Coordinate | null
  cropping: keyof CropHandles | false
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
  cropMoving: boolean
  hotspot: Hotspot | undefined
  resizing: boolean
  moving: boolean
  image: HTMLCanvasElement
  clampedValue: {
    crop: Rect
    hotspot: Rect
  }
}) {
  const context = canvas.getContext('2d')
  if (!context) {
    return
  }

  context.save()

  const pxratio = getDevicePixelRatioLegacy()
  context.scale(pxratio, pxratio)

  const opacity = !readOnly && pointerPosition ? 0.8 : 0.2

  paintBackground({context, image, imageSize, scale})
  paintHotspot({context, opacity, clampedValue, image, imageSize, scale, readOnly})
  debug({context, hotspot, imageSize, scale})
  paintCropBorder({context, crop, imageSize, scale})

  if (!readOnly) {
    highlightCropHandles({
      context,
      opacity,
      cropping,
      crop,
      imageSize,
      scale,
    })
  }

  context.restore()

  // @TODO reading the `.style.cursor` on every tick is potentially slow
  const currentCursor = canvas.style.cursor
  const newCursor = getCursor({
    crop,
    cropMoving,
    cropping,
    hotspot,
    imageSize,
    moving,
    pointerPosition,
    readOnly,
    resizing,
    scale,
  })
  if (currentCursor !== newCursor) {
    canvas.style.cursor = newCursor
  }
}
function paintCropBorder({
  context,
  crop,
  imageSize,
  scale,
}: {
  context: CanvasRenderingContext2D
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
}) {
  const cropRect = getCropRect({crop, imageSize, scale})
  context.save()
  context.beginPath()
  context.fillStyle = 'rgba(66, 66, 66, 0.9)'
  context.lineWidth = 1
  context.rect(cropRect.left, cropRect.top, cropRect.width, cropRect.height)
  context.stroke()
  context.closePath()
  context.restore()
}
function debug({
  context,
  scale,
  hotspot,
  imageSize,
}: {
  context: CanvasRenderingContext2D
  scale: number
  hotspot: Hotspot | undefined
  imageSize: Dimensions
}) {
  context.save()

  const bbox = getHotspotRect({
    hotspot,
    imageSize,
    scale,
  })
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
    line(x, margin, x, imageSize.height - margin)
  }

  function hline(y: number) {
    line(margin, y, imageSize.width - margin, y)
  }

  function line(x1: number, y1: number, x2: number, y2: number) {
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
    context.closePath()
  }
}
function paintHotspot({
  context,
  imageSize,
  opacity,
  clampedValue,
  scale,
  readOnly,
  image,
}: {
  context: CanvasRenderingContext2D
  imageSize: Dimensions
  opacity: number
  clampedValue: {
    crop: Rect
    hotspot: Rect
  }
  scale: number
  readOnly: boolean
  image: HTMLCanvasElement
}) {
  const imageRect = new Rect().setSize(imageSize.width, imageSize.height)

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
function paintBackground({
  context,
  imageSize,
  scale,
  image,
}: {
  context: CanvasRenderingContext2D
  imageSize: Dimensions
  scale: number
  image: HTMLCanvasElement
}) {
  const inner = new Rect().setSize(imageSize.width, imageSize.height).shrink(MARGIN_PX * scale)

  context.save()
  context.fillStyle = 'white'
  context.clearRect(0, 0, imageSize.width, imageSize.height)

  context.globalAlpha = 0.3
  //context.globalCompositeOperation = 'lighten';

  context.drawImage(image, inner.left, inner.top, inner.width, inner.height)
  context.restore()
}
function getCursor({
  pointerPosition,
  readOnly,
  cropping,
  resizing,
  moving,
  cropMoving,
  crop,
  hotspot,
  imageSize,
  scale,
}: {
  pointerPosition: Coordinate | null
  readOnly: boolean
  cropping: keyof CropHandles | false
  resizing: boolean
  moving: boolean
  cropMoving: boolean
  crop: Crop | undefined
  hotspot: Hotspot | undefined
  imageSize: Dimensions
  scale: number
}) {
  if (!pointerPosition || readOnly) {
    return 'auto'
  }

  const activeCropArea =
    cropping ||
    getActiveCropHandleFor({
      pointerPosition,
      crop,
      imageSize,
      scale,
    })
  if (activeCropArea) {
    return getCropCursorForHandle(activeCropArea) || 'auto'
  }

  const pointerOverDragHandle = utils2d.isPointInCircle(
    pointerPosition,
    getDragHandleCoords({
      hotspot,
      imageSize,
      scale,
    }),
  )

  if (resizing || pointerOverDragHandle) {
    return 'move'
  }

  if (moving || cropMoving) {
    return `url(${cursors.CLOSE_HAND}), move`
  }

  const pointerOverHotspot = utils2d.isPointInEllipse(
    pointerPosition,
    getHotspotRect({
      hotspot,
      imageSize,
      scale,
    }),
  )
  const pointerOverCropRect = utils2d.isPointInRect(
    pointerPosition,
    getCropRect({
      crop,
      imageSize,
      scale,
    }),
  )
  if (pointerOverHotspot || pointerOverCropRect) {
    return `url(${cursors.OPEN_HAND}), move`
  }

  return 'auto'
}
function getDragHandleCoords({
  hotspot,
  imageSize,
  scale,
}: {
  hotspot: Hotspot | undefined
  imageSize: Dimensions
  scale: number
}) {
  const bbox = getHotspotRect({
    hotspot,
    imageSize,
    scale,
  })
  const point = utils2d.getPointAtCircumference(Math.PI * 1.25, bbox)
  return {
    x: point.x,
    y: point.y,
    radius: 8 * scale,
  }
}

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

/**
 * hotspot = this.props.value.hotspot || DEFAULT_HOTSPOT
 */
function getHotspotRect({
  hotspot = DEFAULT_HOTSPOT,
  imageSize,
  scale,
}: {
  hotspot: Hotspot | undefined
  imageSize: Dimensions
  scale: number
}) {
  const hotspotRect = new Rect()
    .setSize(hotspot.width, hotspot.height)
    .setCenter(hotspot.x, hotspot.y)

  return new Rect()
    .setSize(imageSize.width, imageSize.height)
    .shrink(MARGIN_PX * scale)
    .multiply(hotspotRect)
}
function getCropRect({
  crop = DEFAULT_CROP,
  imageSize,
  scale,
}: {
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
}) {
  return new Rect()
    .setSize(imageSize.width, imageSize.height)
    .shrink(MARGIN_PX * scale)
    .cropRelative(Rect.fromEdges(crop).clamp(new Rect(0, 0, 1, 1)))
}
function getCropHandles({
  crop,
  imageSize,
  scale,
}: {
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
}) {
  const inner = getCropRect({
    crop,
    imageSize,
    scale,
  })

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

    top: cropHandle.setTopLeft(inner.center.x - halfCropHandleSize, inner.top - halfCropHandleSize),
    topLeft: cropHandle.setTopLeft(inner.left - halfCropHandleSize, inner.top - halfCropHandleSize),
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
function getActiveCropHandleFor({
  crop,
  imageSize,
  scale,
  pointerPosition,
}: {
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
  pointerPosition: Coordinate
}) {
  const {x, y} = pointerPosition
  const cropHandles = getCropHandles({crop, imageSize, scale})
  for (const position of cropHandleKeys) {
    if (utils2d.isPointInRect({x, y}, cropHandles[position])) {
      return position
    }
  }
  return false
}

function highlightCropHandles({
  context,
  opacity,
  cropping,
  crop,
  imageSize,
  scale,
}: {
  context: CanvasRenderingContext2D
  opacity: number
  cropping: keyof CropHandles | false
  crop: Crop | undefined
  imageSize: Dimensions
  scale: number
}) {
  context.save()
  const cropHandles = getCropHandles({crop, imageSize, scale})

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

const getDevicePixelRatioLegacy = memoize(() => {
  const devicePixelRatio = window.devicePixelRatio || 1
  const ctx = document.createElement('canvas').getContext('2d')
  const backingStoreRatio = (ctx && getBackingStoreRatio(ctx)) || 1
  return devicePixelRatio / backingStoreRatio
})

function getDevicePixelRatio() {
  const devicePixelRatio = window.devicePixelRatio || 1
  const ctx = document.createElement('canvas').getContext('2d')
  const backingStoreRatio = (ctx && getBackingStoreRatio(ctx)) || 1
  return devicePixelRatio / backingStoreRatio
}

function useDevicePixelRatio() {
  const [ratio, setRatio] = useState(() =>
    typeof document === 'undefined' ? 1 : getDevicePixelRatio(),
  )

  useEffect(() => {
    const mq = matchMedia(`(resolution: ${ratio}dppx)`)
    function onChange() {
      startTransition(() => setRatio(getDevicePixelRatio()))
    }
    if (!mq.matches) {
      return onChange()
    }
    mq.addEventListener('change', onChange, {once: true})
    return () => {
      mq.removeEventListener('change', onChange)
    }
  }, [ratio])

  return ratio
}

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
