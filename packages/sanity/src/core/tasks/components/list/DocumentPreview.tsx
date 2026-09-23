import {DocumentIcon} from '@sanity/icons/Document'
import {TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {type ComponentProps} from 'react'
import {IntentLink} from 'sanity/router'
import {Text, Flex, Icon} from 'ui5'

import {useSchema} from '../../../hooks/useSchema'
import {getDefaultVariant} from '../../../perspective/getDefaultVariant'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../hooks/useDocumentPreviewValues'
import {inputBorderColorVar, styledIntentLink} from './DocumentPreview.css'

function StyledIntentLink(props: ComponentProps<typeof IntentLink>) {
  const {className, ...rest} = props
  return <IntentLink {...rest} className={clsx(styledIntentLink, className)} />
}

export function DocumentPreview({
  documentId,
  documentType,
}: {
  documentId: string
  documentType: string
}) {
  const schema = useSchema()
  const documentSchema = schema.get(documentType)
  const {perspectiveStack, selectedVariantNames} = usePerspective()
  const selectedVariantName = getDefaultVariant(selectedVariantNames)
  const {isLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
    perspectiveStack,
    variant: selectedVariantName,
  })
  const {color} = useThemeV2()
  const inputBorderColor = color.input.default.enabled.border

  if (!documentSchema) {
    return null
  }

  return (
    <Flex alignItems="center" gap={2}>
      <Icon icon={DocumentIcon} size={1} style={{margin: '-0.375rem'}} />
      {isLoading ? (
        <TextSkeleton size={1} muted />
      ) : (
        <Text
          size={1}
          as={StyledIntentLink}
          intent="edit"
          params={{id: documentId, type: documentType}}
          weight="medium"
          style={{maxWidth: '20ch', ...assignInlineVars({[inputBorderColorVar]: inputBorderColor})}}
          truncate={1}
          trim={true}
        >
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
