import React from 'react'
import {DiffAnnotationTooltip, ObjectDiff, useDiffAnnotationColor} from '../../../diff'
import {hexToRgba} from './helpers'
import {Crop, Hotspot, Image} from './types'

interface HotspotCropSVGProps {
  crop?: Crop
  diff: ObjectDiff<Image>
  hash: string
  hotspot?: Hotspot
  width?: number
  height?: number
}

export function HotspotCropSVG(
  props: HotspotCropSVGProps & Omit<React.SVGProps<SVGElement>, 'ref' | 'width' | 'height'>
) {
  const {crop, diff, hash, hotspot, width = 100, height = 100, ...restProps} = props
  const cropColor = useDiffAnnotationColor(diff, 'crop')
  const hotspotColor = useDiffAnnotationColor(diff, 'hotspot')

  return (
    <svg
      {...restProps}
      fill="none"
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
    >
      <defs>
        {crop && hotspot && (
          <mask id={`mask-hotspot-${hash}`}>
            <rect x={0} y={0} width={width} height={height} fill="#fff" />
            <HotspotSVG
              hotspot={hotspot}
              fill="#000"
              offset={1}
              width={width}
              height={height}
              stroke="#000"
              strokeWidth={3}
            />
          </mask>
        )}
      </defs>

      {crop && (
        <DiffAnnotationTooltip as="g" diff={diff} path="crop" description="Crop changed by">
          <CropSVG
            crop={crop}
            fill={hexToRgba(cropColor.border, 0.25)}
            mask={hotspot ? `url(#mask-hotspot-${hash})` : undefined}
            stroke={cropColor.border}
            strokeWidth={1}
            width={width}
            height={height}
          />
        </DiffAnnotationTooltip>
      )}

      {hotspot && (
        <DiffAnnotationTooltip as="g" diff={diff} path="hotspot" description="Hotspot changed by">
          <HotspotSVG
            hotspot={hotspot}
            fill={hexToRgba(hotspotColor.border, 0.25)}
            stroke={hotspotColor.border}
            strokeWidth={1}
            width={width}
            height={height}
          />
        </DiffAnnotationTooltip>
      )}
    </svg>
  )
}

function CropSVG({
  crop,
  width,
  height,
  ...restProps
}: {crop: Crop; width: number; height: number} & Omit<
  React.SVGProps<SVGRectElement>,
  'width' | 'height'
>) {
  const rectProps = {
    x: crop.left * width,
    y: crop.top * height,
    width: (1 - crop.right - crop.left) * width,
    height: (1 - crop.bottom - crop.top) * height
  }

  return <rect {...restProps} {...rectProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}

function HotspotSVG({
  hotspot,
  offset = 0,
  width,
  height,
  ...restProps
}: {hotspot: Hotspot; offset?: number; width: number; height: number} & Omit<
  React.SVGProps<SVGEllipseElement>,
  'width' | 'height'
>) {
  const ellipseProps = {
    cx: hotspot.x * width,
    cy: hotspot.y * height,
    rx: (hotspot.width / 2) * width + offset,
    ry: (hotspot.height / 2) * height + offset
  }

  return <ellipse {...restProps} {...ellipseProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}
