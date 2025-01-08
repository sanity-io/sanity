import {type ComponentType, type CSSProperties, useMemo, useState} from 'react'

import {type PreviewProps} from '../../components'
import {type RenderPreviewCallbackProps} from '../../form'
import {useTranslation} from '../../i18n'
import {unstable_useValuePreview as useValuePreview} from '../useValuePreview'
import {useVisibility} from '../useVisibility'
import {_HIDE_DELAY} from './_constants'
import {_extractUploadState} from './_extractUploadState'

/**
 * This component is responsible for converting renderPreview() calls into an element.
 * It:
 * - subscribes to "prepared" preview value as long as the element is visible on screen
 * - resolves the configured preview component for the schema type
 * - prepares "preview"-props and passes this to the configured preview component
 * @internal
 * */
export function PreviewLoader(
  props: RenderPreviewCallbackProps & {
    component: ComponentType<Omit<PreviewProps, 'renderDefault'>>
  },
): React.JSX.Element {
  const {
    layout,
    value,
    component: Component,
    style: styleProp,
    schemaType,
    skipVisibilityCheck,
    ...restProps
  } = props

  const {t} = useTranslation()
  const [element, setElement] = useState<HTMLDivElement | null>(null)

  // Subscribe to visibility
  const isVisible =
    useVisibility({
      disabled: skipVisibilityCheck,
      element: element,
      hideDelay: _HIDE_DELAY,
    }) || skipVisibilityCheck

  // Subscribe document preview value
  const preview = useValuePreview({
    enabled: skipVisibilityCheck || isVisible,
    schemaType,
    value,
  })

  const style: CSSProperties = useMemo(
    () => ({
      ...styleProp,
      minWidth: styleProp?.minWidth || 1,
      minHeight: styleProp?.minHeight || 1,
    }),
    [styleProp],
  )

  const uploadState = useMemo(() => _extractUploadState(value), [value])

  const media: PreviewProps['media'] = useMemo(() => {
    if (uploadState?.previewImage) {
      return (
        <img
          alt={t('preview.image.file-is-being-uploaded.alt-text')}
          src={uploadState.previewImage}
        />
      )
    }

    if (!preview?.value?.media) {
      return schemaType.icon
    }

    // @todo: fix `TS2769: No overload matches this call.`
    return preview?.value?.media as any
  }, [preview, schemaType, uploadState, t])

  return (
    <div ref={setElement} style={style}>
      <Component
        {...restProps}
        {...(preview?.value || {})}
        media={media}
        error={preview?.error}
        isPlaceholder={preview?.isLoading}
        layout={layout}
        schemaType={schemaType}
      />
    </div>
  )
}
