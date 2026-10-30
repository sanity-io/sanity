import {isHotspotEnabled} from '@sanity/schema/_internal'
import {
  type Image,
  type ImageCropDimensions,
  type ImageOptions,
  type ImageSchemaType,
} from '@sanity/types'
import {Card, Heading} from '@sanity/ui'
import {
  croppedDimensions,
  cropToPixelRect,
  getImageRefDimensions,
  isSvgImageRef,
  resolveAspectRatio,
} from '@sanity/util/image'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import {Text, Box, Flex, Grid, VStack} from 'ui5'

import {ChangeIndicator} from '../../../../changeIndicators/ChangeIndicator'
import {LoadingBlock} from '../../../../components/loadingBlock/LoadingBlock'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {validationLocaleNamespace} from '../../../../i18n/localeNamespaces'
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
import {type CropConstraints} from './imagetool/types'
import {placeholder} from './ImageToolInput.css'
import {
  getCropSizeStatus,
  getHotspotPreviews,
  getImageToolPath,
  hasCropSizeReadout,
} from './imageToolOptions'
import {useLoadImage} from './useLoadImage'

export interface ImageToolInputProps extends Omit<
  ObjectInputProps<Image, ImageSchemaType>,
  'markers' | 'renderDefault'
> {
  imageUrl: string
}

function ImageUrlDocumentationLink({children}: {children?: ReactNode}) {
  return <a href="https://www.sanity.io/docs/image-urls#fm-048ba39d9e88">{children}</a>
}

function ImageUrlPackageDocumentationLink({children}: {children?: ReactNode}) {
  return (
    <a href="https://www.sanity.io/docs/image-urls#fm-048ba39d9e88">
      <code>{children}</code>
    </a>
  )
}

const DEFAULT_VALUE: Partial<Image> = {
  crop: DEFAULT_CROP,
  hotspot: DEFAULT_HOTSPOT,
}

function LoadStatus(props: {children: ReactNode}) {
  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      padding={4}
      style={{overflowWrap: 'break-word'}}
    >
      {props.children}
    </Flex>
  )
}

function CropSize(props: {dimensions: ImageCropDimensions; options: ImageOptions | undefined}) {
  const {dimensions, options} = props
  const {t} = useTranslation()
  const {t: tValidation} = useTranslation(validationLocaleNamespace)
  const {tone, threshold} = getCropSizeStatus(dimensions, options)

  return (
    <Flex
      marginTop={2}
      gap={2}
      alignItems="center"
      flexWrap="wrap"
      data-testid="image-tool-crop-size"
      data-tone={tone ?? 'default'}
    >
      <Text size={1} weight="medium" tone={tone}>
        {t('inputs.imagetool.crop-size.dimensions', {...dimensions})}
      </Text>
      {tone === 'critical' ? (
        <Text size={1} tone={tone}>
          {tValidation('object.image-below-min-dimensions', {...threshold})}
        </Text>
      ) : null}
      {tone === 'caution' ? (
        <Text size={1} tone={tone}>
          {tValidation('object.image-below-recommended-dimensions', {...threshold})}
        </Text>
      ) : null}
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
    elementProps: {ref: forwardRef},
  } = props
  const ref = useRef<HTMLDivElement | null>(null)
  useImperativeHandle(forwardRef, () => ref.current)

  const [localValue, setLocalValue] = useState(value || DEFAULT_VALUE)

  const {image, isLoading: isImageLoading, error: imageLoadError} = useLoadImage(imageUrl)

  const hotspotEnabled = isHotspotEnabled(schemaType.options)
  const imageToolPath = getImageToolPath(schemaType.options)

  const {aspectRatio, minDimensions} = schemaType.options ?? {}
  const cropConstraints = useMemo<CropConstraints>(
    () => ({
      aspectRatio: aspectRatio === undefined ? undefined : resolveAspectRatio(aspectRatio),
      minDimensions,
    }),
    [aspectRatio, minDimensions],
  )

  const assetRef = value?.asset?._ref
  const sourceSize = useMemo(() => getImageRefDimensions(assetRef), [assetRef])

  const handleFocus = useCallback(() => {
    onPathFocus(imageToolPath)
  }, [imageToolPath, onPathFocus])

  useEffect(() => {
    // oxlint-disable-next-line react/set-state-in-effect -- pre-existing violation, to be fixed in a follow-up
    setLocalValue(value || DEFAULT_VALUE)
  }, [value])

  const hasFocus = focusPath[0] === imageToolPath[0]

  const hotspotPreviews = getHotspotPreviews(schemaType.options)

  const cropSize =
    sourceSize && hasCropSizeReadout(schemaType.options)
      ? croppedDimensions(cropToPixelRect(localValue.crop || DEFAULT_CROP, sourceSize))
      : undefined

  useDidUpdate(hasFocus, (hadFocus) => {
    if (!hadFocus && hasFocus) {
      ref.current?.focus()
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

      // With the hotspot on, a change to either fills in the default for the other if it is missing
      const crop = cropField
        ? {_type: cropField.type.name, ...(finalValue.crop || DEFAULT_CROP)}
        : finalValue.crop

      if (hotspotEnabled) {
        const hotspot = hotspotField
          ? {_type: hotspotField.type.name, ...(finalValue.hotspot || DEFAULT_HOTSPOT)}
          : finalValue.hotspot

        onChange([set(crop, ['crop']), set(hotspot, ['hotspot'])])
        return
      }

      onChange(set(crop, ['crop']))
    },
    [hotspotEnabled, onChange, readOnly, schemaType.fields],
  )

  const isSvg = useMemo(() => isSvgImageRef(assetRef), [assetRef])

  const {t} = useTranslation()
  return (
    <FormField
      title={hotspotEnabled ? t('inputs.imagetool.title') : t('inputs.imagetool.crop-only.title')}
      level={level}
      description={
        hotspotEnabled
          ? t('inputs.imagetool.description')
          : t('inputs.imagetool.crop-only.description')
      }
      deprecated={schemaType.deprecated}
      path={path}
      __unstable_presence={presence}
    >
      {isSvg ? (
        <>
          <Card padding={3} marginY={3} tone="caution" radius={2}>
            <VStack gap={4}>
              <Text size={1} as="div" trim={true} tone="caution">
                {t('inputs.imagetool.vector-warning.title')}
              </Text>
              <Details title={t('inputs.imagetool.vector-warning.expand-developer-info')}>
                <Text size={1} as="div" trim={true} tone="caution">
                  <Translate
                    t={t}
                    i18nKey="inputs.imagetool.vector-warning.developer-info"
                    components={{ImageUrlDocumentationLink, ImageUrlPackageDocumentationLink}}
                  />
                </Text>
              </Details>
            </VStack>
          </Card>
        </>
      ) : null}

      <div>
        <Card
          __unstable_checkered
          __unstable_focusRing
          tabIndex={0}
          ref={ref}
          onFocus={handleFocus}
          border
        >
          <ChangeIndicator
            path={path.concat(imageToolPath)}
            hasFocus={hasFocus}
            isChanged={changed}
          >
            <RatioBox $ratio={3 / 2}>
              {(isImageLoading || imageLoadError) && (
                <LoadStatus>
                  {imageLoadError ? (
                    <Card padding={4} radius={2} tone="critical" border>
                      <Text as="div" trim={true} tone="critical">
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
                <Box>
                  <ImageTool
                    value={localValue}
                    src={image.src}
                    sourceSize={sourceSize}
                    cropConstraints={cropConstraints}
                    hotspotEnabled={hotspotEnabled}
                    readOnly={Boolean(readOnly)}
                    onChangeEnd={handleChangeEnd}
                    onChange={setLocalValue}
                  />
                </Box>
              )}
            </RatioBox>
          </ChangeIndicator>
        </Card>

        {cropSize ? <CropSize dimensions={cropSize} options={schemaType.options} /> : null}

        {hotspotPreviews.length > 0 ? (
          <Box marginTop={2}>
            <Grid gridTemplateColumns="repeat(4, minmax(0, 1fr))" gap={1}>
              {hotspotPreviews.map(({title, aspectRatio}) => (
                <Box key={`${title}-${aspectRatio}`} marginTop={2}>
                  <Heading as="h4" size={0}>
                    {title}
                  </Heading>
                  <Box marginTop={2}>
                    <RatioBox $ratio={aspectRatio}>
                      <Card __unstable_checkered border>
                        {!isImageLoading && image ? (
                          <HotspotImage
                            aspectRatio={aspectRatio}
                            src={image.src}
                            srcAspectRatio={image.width / image.height}
                            hotspot={localValue.hotspot || DEFAULT_HOTSPOT}
                            crop={localValue.crop || DEFAULT_CROP}
                          />
                        ) : (
                          <div className={placeholder} />
                        )}
                      </Card>
                    </RatioBox>
                  </Box>
                </Box>
              ))}
            </Grid>
          </Box>
        ) : null}
      </div>
    </FormField>
  )
}
