import {
  type GlobalDocumentReferenceSchemaType,
  type GlobalDocumentReferenceValue,
} from '@sanity/types'
import {Stack, Text, TextSkeleton} from '@sanity/ui'

import {Translate, useTranslation} from '../../../i18n'
import {GlobalDocumentReferencePreview} from './GlobalDocumentReferencePreview'
import {type GlobalDocumentReferenceInfo} from './types'
import {type Loadable} from './useReferenceInfo'

export function PreviewReferenceValue(props: {
  value: GlobalDocumentReferenceValue
  showStudioUrlIcon?: boolean
  hasStudioUrl?: boolean
  type: GlobalDocumentReferenceSchemaType
  referenceInfo: Loadable<GlobalDocumentReferenceInfo>
}): React.JSX.Element {
  const {value, type, showStudioUrlIcon, hasStudioUrl, referenceInfo} = props
  const {t} = useTranslation()

  if (referenceInfo.isLoading || referenceInfo.error) {
    return (
      <Stack space={2} padding={1}>
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated={!referenceInfo.error} />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated={!referenceInfo.error} />
      </Stack>
    )
  }
  const showTypeLabel = type.to.length > 1

  const refTypeName = referenceInfo.result?.type
  const refType = type.to.find((toType) => toType.type === refTypeName)

  if (referenceInfo.result.availability?.available && !refType) {
    return (
      <Stack space={2} padding={2}>
        <Text as="p">
          <Translate
            t={t}
            i18nKey="inputs.reference.global.invalid-type"
            values={{typeName: refTypeName || 'unknown'}}
            components={{JsonValue: () => <pre>{JSON.stringify(value, null, 2)}</pre>}}
          />
        </Text>
      </Stack>
    )
  }

  return (
    <GlobalDocumentReferencePreview
      availability={referenceInfo.result.availability}
      hasStudioUrl={hasStudioUrl}
      showStudioUrlIcon={showStudioUrlIcon}
      preview={referenceInfo.result.preview}
      refType={refType}
      resourceType={type.resourceType}
      resourceId={type.resourceId}
      id={value._ref}
      showTypeLabel={showTypeLabel}
    />
  )
}
