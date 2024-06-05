import {useMemo} from 'react'
import {
  type PreviewValue,
  type SchemaType,
  unstable_useValuePreview as useValuePreview,
  useTranslation,
} from 'sanity'

interface UseValuePreviewWithFallbackProps {
  schemaType?: SchemaType
  value: unknown | undefined
}

interface Value extends PreviewValue {
  title: string
}

interface ReturnType {
  isLoading: boolean
  error?: Error
  value: Value
}

/**
 * A hook that extends `useValuePreview` with a fallback title
 */
export function useValuePreviewWithFallback(props: UseValuePreviewWithFallbackProps): ReturnType {
  const preview = useValuePreview(props)
  const {t} = useTranslation()

  return useMemo(
    (): ReturnType => ({
      ...preview,
      value: {
        ...(preview?.value || {}),
        title: preview?.value?.title || t('preview.default.title-fallback'),
      },
    }),
    [preview, t],
  )
}
