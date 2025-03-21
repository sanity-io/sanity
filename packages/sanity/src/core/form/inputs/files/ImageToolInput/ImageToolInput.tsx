import {type Image, type ImageSchemaType} from '@sanity/types'
import {Box, Card, Flex, Grid, Heading, Stack, Text} from '@sanity/ui'
import {type ReactNode, useCallback, useEffect, useMemo, useState} from 'react'
import {styled} from 'styled-components'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {Translate} from '../../../../i18n/Translate'
import {EMPTY_ARRAY} from '../../../../util/empty'
import {Details} from '../../../components/Details'
import {FormField} from '../../../components/formField/FormField'
import {useDidUpdate} from '../../../hooks/useDidUpdate'
import {set} from '../../../patch/patch'
import {type ObjectInputProps} from '../../../types/inputProps'
import {RatioBox} from '../common/RatioBox'
import {DEFAULT_CROP, DEFAULT_HOTSPOT} from './imagetool/constants'
import {HotspotImage} from './imagetool/HotspotImage'
import {ImageTool} from './imagetool/ImageTool'
import {useLoadImage} from './useLoadImage'

export interface ImageToolInputProps
  extends Omit<ObjectInputProps<Image, ImageSchemaType>, 'markers' | 'renderDefault'> {
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

const Placeholder = styled.div`
  min-height: 6em;
`

function LoadStatus(props: {children: ReactNode}) {
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
    onPathFocus,
    readOnly,
    elementProps,
  } = props

  const [localValue, setLocalValue] = useState(value || DEFAULT_VALUE)

  const {image, isLoading: isImageLoading, error: imageLoadError} = useLoadImage(imageUrl)

  const handleFocus = useCallback(() => {
    onPathFocus(HOTSPOT_PATH)
  }, [onPathFocus])

  useEffect(() => {
    setLocalValue(value || DEFAULT_VALUE)
  }, [value])

  const hasFocus = focusPath[0] === 'hotspot'

  useDidUpdate(hasFocus, (hadFocus) => {
    if (!hadFocus && hasFocus) {
      elementProps.ref.current?.focus()
    }
  })

  const handleChangeEnd = useCallback(
    (finalValue: any) => {
      if (readOnly) {
        return
      }
      // For backwards compatibility, where hotspot/crop might not have a named type yet
      const cropField = schemaType.fields.find(
        (field) => field.name === 'crop' && field.type.name !== 'object',
      )

      const hotspotField = schemaType.fields.find(
        (field) => field.type.name !== 'object' && field.name === 'hotspot',
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
    [onChange, readOnly, schemaType.fields],
  )

  const isSvg = useMemo(() => value?.asset?._ref?.split('-').at(-1) === 'svg', [value?.asset?._ref])

  const {t} = useTranslation()
  return (
    <FormField
      title={t('inputs.imagetool.title')}
      level={level}
      description={t('inputs.imagetool.description')}
      deprecated={schemaType.deprecated}
      __unstable_presence={presence}
    >
      {isSvg ? (
        <>
          <Card padding={3} marginY={3} tone="caution" radius={2}>
            <Stack space={4}>
              <Text size={1}>{t('inputs.imagetool.vector-warning.title')}</Text>
              <Details title={t('inputs.imagetool.vector-warning.expand-developer-info')}>
                <Text size={1}>
                  <Translate
                    t={t}
                    i18nKey="inputs.imagetool.vector-warning.developer-info"
                    components={{
                      ImageUrlDocumentationLink: ({children}) => (
                        <a href="https://www.sanity.io/docs/image-urls#fm-048ba39d9e88">
                          {children}
                        </a>
                      ),
                      ImageUrlPackageDocumentationLink: ({children}) => (
                        <a href="https://www.sanity.io/docs/image-urls#fm-048ba39d9e88">
                          <code>{children}</code>
                        </a>
                      ),
                    }}
                  />
                </Text>
              </Details>
            </Stack>
          </Card>
        </>
      ) : null}

      <div>
        <Card
          __unstable_checkered
          __unstable_focusRing
          tabIndex={0}
          ref={elementProps.ref}
          onFocus={handleFocus}
        >
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
                      <Text>
                        {t('inputs.imagetool.load-error', {
                          errorMessage: imageLoadError.message,
                        })}
                      </Text>
                    </Card>
                  ) : (
                    <LoadingBlock showText />
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
        </Card>
        <Box marginTop={3}>
          <Grid columns={PREVIEW_ASPECT_RATIOS.length} gap={1}>
            {PREVIEW_ASPECT_RATIOS.map(([title, ratio]) => (
              <div key={ratio}>
                <Heading as="h4" size={0}>
                  {title}
                </Heading>
                <Box marginTop={2}>
                  <RatioBox ratio={ratio}>
                    <Card __unstable_checkered>
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
                    </Card>
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
