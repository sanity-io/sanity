import {hues} from '@sanity/color'
import {diffInput, wrap} from '@sanity/diff'
import {type Image, type ImageCrop, type ImageHotspot} from '@sanity/types'
import {Card} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {Text, VStack} from 'ui5'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {type AnnotationDetails, type ObjectDiff} from '../../../../types'
import {HotspotCropSVG} from '../HotspotCropSVG'

const ANNOTATION: AnnotationDetails = {author: 'doug', timestamp: '2020-06-15T12:00:00.000Z'}

const CROP: ImageCrop = {left: 0.1, top: 0.15, right: 0.2, bottom: 0.25}
const HOTSPOT: ImageHotspot = {x: 0.4, y: 0.45, width: 0.5, height: 0.4}

const FROM: Image = {
  _type: 'image',
  crop: {left: 0, top: 0, right: 0, bottom: 0},
  hotspot: {x: 0.5, y: 0.5, width: 1, height: 1},
}

const TO: Image = {_type: 'image', crop: CROP, hotspot: HOTSPOT}

const DIFF = diffInput(wrap(FROM, ANNOTATION), wrap(TO, ANNOTATION)) as ObjectDiff<Image>

const SIZE = 200

const TILE: CSSProperties = {
  position: 'relative',
  width: SIZE,
  height: SIZE,
  backgroundColor: hues.gray[100].hex,
  backgroundImage: [
    `linear-gradient(45deg, ${hues.gray[50].hex} 25%, transparent 25%)`,
    `linear-gradient(-45deg, ${hues.gray[50].hex} 25%, transparent 25%)`,
    `linear-gradient(45deg, transparent 75%, ${hues.gray[50].hex} 75%)`,
    `linear-gradient(-45deg, transparent 75%, ${hues.gray[50].hex} 75%)`,
  ].join(', '),
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
}

function OverlayTile(props: {crop?: ImageCrop; hotspot?: ImageHotspot}) {
  return (
    <div style={TILE}>
      <HotspotCropSVG
        crop={props.crop}
        diff={DIFF}
        hash="fixture"
        height={SIZE}
        hotspot={props.hotspot}
        style={{display: 'block'}}
        width={SIZE}
      />
    </div>
  )
}

/**
 * Chromatic sentinel for the review-changes image crop/hotspot SVG overlay.
 * Pins crop rect geometry, hotspot ellipse geometry, and the combined mask
 * that punches the hotspot out of the crop fill. Annotation colors come from
 * a fixture author. Tooltips stay closed (no relative timestamps).
 */
export function HotspotCropSVGStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <Card padding={4} style={{maxWidth: 480}}>
        <VStack gap={5}>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              crop
            </Text>
            <OverlayTile crop={CROP} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              hotspot
            </Text>
            <OverlayTile hotspot={HOTSPOT} />
          </VStack>
          <VStack gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              crop and hotspot
            </Text>
            <OverlayTile crop={CROP} hotspot={HOTSPOT} />
          </VStack>
        </VStack>
      </Card>
    </TestWrapper>
  )
}
