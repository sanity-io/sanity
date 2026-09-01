import {DocumentIcon} from '@sanity/icons/Document'
import {Text, TextSkeleton} from '@sanity/ui'
import {getTheme_v2} from '@sanity/ui/theme'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'
import {Flex} from 'ui5'

import {useSchema} from '../../../hooks/useSchema'
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
  const {perspectiveStack, selectedVariantName} = usePerspective()
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
      <Text size={1}>
        <DocumentIcon />
      </Text>
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
          textOverflow="ellipsis"
        >
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
