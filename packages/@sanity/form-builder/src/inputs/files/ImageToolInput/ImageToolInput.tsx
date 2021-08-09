import React, {ForwardedRef, forwardRef, useCallback, useEffect, useState} from 'react'
import {FormField} from '@sanity/base/components'
import {ImageCrop, ImageHotspot, ObjectSchemaType, Path} from '@sanity/types'
import ImageTool from '@sanity/imagetool'
import HotspotImage from '@sanity/imagetool/HotspotImage'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from '@sanity/imagetool/constants'

import {Box, Card, Flex, Text, Grid, Heading, useForwardedRef} from '@sanity/ui'
import styled from 'styled-components'
import {ChangeIndicatorForFieldPath} from '@sanity/base/change-indicators'
import shallowEquals from 'shallow-equals'
import {FormFieldPresence} from '@sanity/base/presence'
import PatchEvent, {set} from '../../../PatchEvent'
import {Checkerboard} from '../../../components/Checkerboard'
import {withFocusRing} from '../../../components/withFocusRing'
import {RatioBox} from '../common/RatioBox'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {useLoadImage} from './useLoadImage'

interface Value {
  hotspot?: ImageHotspot
  crop?: ImageCrop
}

interface ImageToolInputProps {
  imageUrl: string
  value?: Value
  compareValue?: Value
  onChange: (event: PatchEvent) => void
  readOnly: boolean | null
  focusPath: Path
  presence?: FormFieldPresence[]
  onFocus: (nextPath: Path) => void
  level: number
  type: ObjectSchemaType
}

const HOTSPOT_PATH = ['hotspot']

const PREVIEW_ASPECT_RATIOS = [
  ['3:4', 3 / 4],
  ['Square', 1 / 1],
  ['16:9', 16 / 9],
  ['Panorama', 4 / 1],
] as const

const DEFAULT_VALUE: Value = {
  crop: DEFAULT_CROP,
  hotspot: DEFAULT_HOTSPOT,
}

const CheckerboardWithFocusRing = withFocusRing(Checkerboard)

const Placeholder = styled.div`
  min-height: 6em;
`

function LoadStatus(props: {children: React.ReactNode}) {
  return (
    <Flex align="center" justify="center" padding={4} style={{overflowWrap: 'break-word'}}>
      {props.children}
    </Flex>
  )
}

export const ImageToolInput = forwardRef(function ImageToolInput(
  props: ImageToolInputProps,
  ref: ForwardedRef<HTMLDivElement>
) {
  const {
    imageUrl,
    value,
    compareValue,
    level,
    readOnly,
    focusPath,
    onFocus,
    presence,
    onChange,
    type,
  } = props

  const [localValue, setLocalValue] = useState(value || DEFAULT_VALUE)

  const {image, isLoading: isImageLoading, error: imageLoadError} = useLoadImage(imageUrl)

  const forwardedRef = useForwardedRef(ref)

  const handleFocus = useCallback(() => {
    onFocus(HOTSPOT_PATH)
  }, [onFocus])

  useEffect(() => {
    setLocalValue(value || DEFAULT_VALUE)
  }, [value])

  const hasFocus = focusPath[0] === 'hotspot'

  useDidUpdate(hasFocus, (hadFocus) => {
    if (!hadFocus && hasFocus) {
      forwardedRef.current?.focus()
    }
  })

  const handleChangeEnd = useCallback(
    (finalValue) => {
      if (readOnly) {
        return
      }
      // For backwards compatibility, where hotspot/crop might not have a named type yet
      const cropField = type.fields.find(
        (field) => field.name === 'crop' && field.type.name !== 'object'
      )

      const hotspotField = type.fields.find(
        (field) => field.type.name !== 'object' && field.name === 'hotspot'
      )

      // Note: when either hotspot or crop change we fill in the default if the other is missing
      // (we can't have one without the other)
      const crop = cropField
        ? {_type: cropField.type.name, ...(finalValue.crop || DEFAULT_CROP)}
        : finalValue.crop

      const hotspot = hotspotField
        ? {_type: hotspotField.type.name, ...(finalValue.hotspot || DEFAULT_HOTSPOT)}
        : finalValue.hotspot

      onChange(PatchEvent.from([set(crop, ['crop']), set(hotspot, ['hotspot'])]))
    },
    [onChange, readOnly, type.fields]
  )

  return (
    <FormField
      title="Hotspot &amp; crop"
      level={level}
      description="Adjust the rectangle to crop image. Adjust the circle to specify the area that should always be visible."
      __unstable_changeIndicator={false}
      __unstable_presence={presence}
    >
      <div>
        <CheckerboardWithFocusRing tabIndex={0} ref={forwardedRef} onFocus={handleFocus}>
          <ChangeIndicatorForFieldPath
            path={HOTSPOT_PATH}
            hasFocus={focusPath[0] === 'hotspot'}
            isChanged={
              !shallowEquals(value?.crop, compareValue?.crop) ||
              !shallowEquals(compareValue?.hotspot, value?.hotspot)
            }
          >
            <RatioBox ratio={3 / 2}>
              {(isImageLoading || imageLoadError) && (
                <LoadStatus>
                  {imageLoadError ? (
                    <Card padding={4} radius={2} tone="critical" border>
                      <Text>Error: {imageLoadError.message}</Text>
                    </Card>
                  ) : (
                    <Text muted>Loading image… </Text>
                  )}
                </LoadStatus>
              )}
              {!isImageLoading && image && (
                <Box margin={1}>
                  <ImageTool
                    value={localValue}
                    src={image.src}
                    readOnly={Boolean(readOnly)}
                    onChangeEnd={handleChangeEnd}
                    onChange={setLocalValue}
                  />
                </Box>
              )}
            </RatioBox>
          </ChangeIndicatorForFieldPath>
        </CheckerboardWithFocusRing>
        <Box marginTop={3}>
          <Grid columns={PREVIEW_ASPECT_RATIOS.length} gap={1}>
            {PREVIEW_ASPECT_RATIOS.map(([title, ratio]) => (
              <div key={ratio}>
                <Heading as="h4" size={0}>
                  {title}
                </Heading>
                <Box marginTop={2}>
                  <RatioBox ratio={ratio}>
                    <Checkerboard>
                      {!isImageLoading && image ? (
                        <HotspotImage
                          aspectRatio={ratio}
                          src={image.src}
                          srcAspectRatio={image.width / image.height}
                          hotspot={localValue.hotspot || DEFAULT_HOTSPOT}
                          crop={localValue.crop || DEFAULT_CROP}
                        />
                      ) : (
                        <Placeholder />
                      )}
                    </Checkerboard>
                  </RatioBox>
                </Box>
              </div>
            ))}
          </Grid>
        </Box>
      </div>
    </FormField>
  )
})
