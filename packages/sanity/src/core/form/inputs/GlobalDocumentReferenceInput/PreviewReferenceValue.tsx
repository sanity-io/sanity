import {
  type GlobalDocumentReferenceSchemaType,
  type GlobalDocumentReferenceValue,
} from '@sanity/types'
import {Text, TextSkeleton} from '@sanity/ui'
import {Flex} from 'ui5'

import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {Translate} from '../../../i18n/Translate'
import {GlobalDocumentReferencePreview} from './GlobalDocumentReferencePreview'
import {type GlobalDocumentReferenceInfo} from './types'
import {type Loadable} from './useReferenceInfo'

function JsonValue({value}: {children?: React.ReactNode; value?: unknown}) {
  return <pre>{JSON.stringify(value, null, 2)}</pre>
}

export function PreviewReferenceValue(props: {
  value: GlobalDocumentReferenceValue
  showStudioUrlIcon?: boolean
  hasStudioUrl?: boolean
  type: GlobalDocumentReferenceSchemaType
  referenceInfo: Loadable<GlobalDocumentReferenceInfo>
}): React.JSX.Element {
  const {value, type, showStudioUrlIcon, hasStudioUrl, referenceInfo} = props
  const {t} = useTranslation()

  if (referenceInfo.isLoading || referenceInfo.error || !referenceInfo.result) {
    return (
      <Flex gap={2} padding={1} flexDirection="column">
        <TextSkeleton style={{maxWidth: 320}} radius={1} animated={!referenceInfo.error} />
        <TextSkeleton style={{maxWidth: 200}} radius={1} size={1} animated={!referenceInfo.error} />
      </Flex>
    )
  }
  const showTypeLabel = type.to.length > 1

  const refTypeName = referenceInfo.result.type
  const refType = type.to.find((toType) => toType.type === refTypeName)

  if (referenceInfo.result.availability?.available && !refType) {
    return (
      <Flex gap={2} padding={2} flexDirection="column">
        <Text as="p">
          <Translate
            t={t}
            i18nKey="inputs.reference.global.invalid-type"
            values={{typeName: refTypeName || 'unknown'}}
            components={{JsonValue}}
            componentProps={{value}}
          />
        </Text>
      </Flex>
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
