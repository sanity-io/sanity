import {DocumentIcon} from '@sanity/icons/Document'
import {TextSkeleton} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'
import {Text, Flex, Icon} from 'ui5'

import {useSchema} from '../../../hooks/useSchema'
import {getDefaultVariant} from '../../../perspective/getDefaultVariant'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../hooks/useDocumentPreviewValues'

const StyledIntentLink = styled(IntentLink)((props) => {
  const theme = getTheme_v2(props.theme)

  return `
  text-decoration: underline;
  text-decoration-color: ${theme.color.input.default.enabled.border};
  text-underline-offset: 2px;
`
})
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
          style={{maxWidth: '20ch'}}
          truncate={1}
          trim={true}
        >
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
