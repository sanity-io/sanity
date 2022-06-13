import React, {useCallback, useEffect, useState} from 'react'
import type {Image, ImageSchemaType} from '@sanity/types'
import {Box, Card, Flex, Text, Grid, Heading, useForwardedRef} from '@sanity/ui'
import styled from 'styled-components'
import {ChangeIndicator} from '../../../../components/changeIndicators'
import {FormField} from '../../../components/formField'
import {set} from '../../../patch'
import {Checkerboard} from '../../../components/Checkerboard'
import {withFocusRing} from '../../../components/withFocusRing'
import {RatioBox} from '../common/RatioBox'
import {EMPTY_ARRAY} from '../../../utils/empty'
import type {ObjectInputProps} from '../../../types'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {ImageTool, HotspotImage, DEFAULT_CROP, DEFAULT_HOTSPOT} from './imagetool'
import {useLoadImage} from './useLoadImage'

export interface ImageToolInputProps
  extends Omit<ObjectInputProps<Image, ImageSchemaType>, 'markers'> {
  imageUrl: string
}

const HOTSPOT_PATH = ['hotspot']

const PREVIEW_ASPECT_RATIOS = [
  ['3:4', 3 / 4],
  ['Square', 1 / 1],
  ['16:9', 16 / 9],
  ['Panorama', 4 / 1],
] as const

const DEFAULT_VALUE: Partial<Image> = {
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

export function ImageToolInput(props: ImageToolInputProps) {
  const {
    imageUrl,
    value,
    changed,
    level,
    path,
    focusPath = EMPTY_ARRAY,
    presence,
    onChange,
    schemaType,
    onFocusPath,
    readOnly,
    focusRef,
  } = props

  const [localValue, setLocalValue] = useState(value || DEFAULT_VALUE)

  const {image, isLoading: isImageLoading, error: imageLoadError} = useLoadImage(imageUrl)

  const forwardedRef = useForwardedRef(focusRef)

  const handleFocus = useCallback(() => {
    onFocusPath(HOTSPOT_PATH)
  }, [onFocusPath])

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
      const cropField = schemaType.fields.find(
        (field) => field.name === 'crop' && field.type.name !== 'object'
      )

      const hotspotField = schemaType.fields.find(
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

      onChange([set(crop, ['crop']), set(hotspot, ['hotspot'])])
    },
    [onChange, readOnly, schemaType.fields]
  )

  return (
    <FormField
      title="Hotspot &amp; crop"
      level={level}
      description="Adjust the rectangle to crop image. Adjust the circle to specify the area that should always be visible."
      __unstable_presence={presence}
    >
      <div>
        <CheckerboardWithFocusRing tabIndex={0} ref={forwardedRef} onFocus={handleFocus}>
          <ChangeIndicator
            path={path.concat(HOTSPOT_PATH)}
            hasFocus={focusPath[0] === 'hotspot'}
            isChanged={changed}
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
          </ChangeIndicator>
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
}
