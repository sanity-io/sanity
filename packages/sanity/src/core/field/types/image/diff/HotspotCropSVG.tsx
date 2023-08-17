import {Image, ImageCrop, ImageHotspot} from '@sanity/types'
import React from 'react'
import {DiffTooltip, useDiffAnnotationColor} from '../../../diff'
import {ObjectDiff} from '../../../types'
import {hexToRgba} from './helpers'

interface HotspotCropSVGProps {
  crop?: ImageCrop
  diff: ObjectDiff<Image>
  hash: string
  hotspot?: ImageHotspot
  width?: number
  height?: number
}

export function HotspotCropSVG(
  props: HotspotCropSVGProps & Omit<React.SVGProps<SVGElement>, 'ref' | 'width' | 'height'>,
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
        <DiffTooltip diff={diff} path="crop" description="Crop changed">
          <g>
            <CropSVG
              crop={crop}
              fill={hexToRgba(cropColor.border, 0.25)}
              mask={hotspot ? `url(#mask-hotspot-${hash})` : undefined}
              stroke={cropColor.border}
              strokeWidth={1}
              width={width}
              height={height}
            />
          </g>
        </DiffTooltip>
      )}

      {hotspot && (
        <DiffTooltip diff={diff} path="hotspot" description="Hotspot changed">
          <g>
            <HotspotSVG
              hotspot={hotspot}
              fill={hexToRgba(hotspotColor.border, 0.25)}
              stroke={hotspotColor.border}
              strokeWidth={1}
              width={width}
              height={height}
            />
          </g>
        </DiffTooltip>
      )}
    </svg>
  )
}

function CropSVG({
  crop,
  width,
  height,
  ...restProps
}: {crop: ImageCrop; width: number; height: number} & Omit<
  React.SVGProps<SVGRectElement>,
  'width' | 'height'
>) {
  const rectProps = {
    x: crop.left * width,
    y: crop.top * height,
    width: (1 - crop.right - crop.left) * width,
    height: (1 - crop.bottom - crop.top) * height,
  }

  return <rect {...restProps} {...rectProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}

function HotspotSVG({
  hotspot,
  offset = 0,
  width,
  height,
  ...restProps
}: {hotspot: ImageHotspot; offset?: number; width: number; height: number} & Omit<
  React.SVGProps<SVGEllipseElement>,
  'width' | 'height'
>) {
  const ellipseProps = {
    cx: hotspot.x * width,
    cy: hotspot.y * height,
    rx: (hotspot.width / 2) * width + offset,
    ry: (hotspot.height / 2) * height + offset,
  }

  return <ellipse {...restProps} {...ellipseProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}
