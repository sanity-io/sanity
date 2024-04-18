import {DocumentIcon} from '@sanity/icons'
import {Flex, Text, TextSkeleton} from '@sanity/ui'
// eslint-disable-next-line camelcase
import {getTheme_v2} from '@sanity/ui/theme'
import {forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useSchema} from '../../../hooks'
import {useDocumentPreviewValues} from '../../hooks'

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
  const {isLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
  })

  const Link = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <StyledIntentLink
            {...linkProps}
            intent="edit"
            params={{id: documentId, type: documentType}}
            ref={ref}
          />
        )
      }),
    [documentId, documentType],
  )

  if (!documentSchema) {
    return null
  }

  return (
    <Flex align="center" gap={2}>
      <Text size={1}>
        <DocumentIcon />
      </Text>
      {isLoading ? (
        <TextSkeleton size={1} muted />
      ) : (
        <Text size={1} as={Link} weight="medium" style={{maxWidth: '20ch'}} textOverflow="ellipsis">
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
