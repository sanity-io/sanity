import React from 'react'
import {DiffAnnotationTooltip, ObjectDiff, useDiffAnnotationColor} from '../../../diff'
import {hexToRgba} from './helpers'
import {Crop, Hotspot, Image} from './types'

interface HotspotCropSVGProps {
  crop?: Crop
  diff: ObjectDiff<Image>
  hash: string
  hotspot?: Hotspot
}

export function HotspotCropSVG(
  props: HotspotCropSVGProps & Omit<React.SVGProps<SVGElement>, 'ref'>
) {
  const {crop, diff, hash, hotspot, ...restProps} = props
  const cropColor = useDiffAnnotationColor(diff, 'crop')
  const hotspotColor = useDiffAnnotationColor(diff, 'hotspot')

  return (
    <svg {...restProps} fill="none" viewBox="0 0 100 100">
      <defs>
        {crop && hotspot && (
          <mask id={`mask-hotspot-${hash}`}>
            <rect x={0} y={0} width={100} height={100} fill="#fff" />
            <HotspotSVG hotspot={hotspot} fill="#000" offset={1} />
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
          />
        </DiffAnnotationTooltip>
      )}
    </svg>
  )
}

function CropSVG({crop, ...restProps}: {crop: Crop} & React.SVGProps<SVGRectElement>) {
  const rectProps = {
    x: crop.left * 100,
    y: crop.top * 100,
    width: (1 - crop.right - crop.left) * 100,
    height: (1 - crop.bottom - crop.top) * 100
  }

  return <rect {...restProps} {...rectProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}

function HotspotSVG({
  hotspot,
  offset = 0,
  ...restProps
}: {hotspot: Hotspot; offset?: number} & React.SVGProps<SVGEllipseElement>) {
  const ellipseProps = {
    cx: hotspot.x * 100,
    cy: hotspot.y * 100,
    rx: (hotspot.width / 2) * 100 + offset,
    ry: (hotspot.height / 2) * 100 + offset
  }

  return <ellipse {...restProps} {...ellipseProps} style={{vectorEffect: 'non-scaling-stroke'}} />
}
