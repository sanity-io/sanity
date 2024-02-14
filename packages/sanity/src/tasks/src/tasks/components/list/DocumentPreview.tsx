import {DocumentIcon} from '@sanity/icons'
import {Flex, Text, TextSkeleton} from '@sanity/ui'
import {forwardRef, useMemo} from 'react'
import {useSchema} from 'sanity'

import {useDocumentPreviewValues} from '../../hooks/useDocumentPreviewValues'
import {StyledIntentLink} from './TasksListItem'

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
    <Flex align="center" gap={1}>
      <DocumentIcon />
      {isLoading || !value?.title ? (
        <TextSkeleton size={1} muted />
      ) : (
        <Text size={1} muted as={Link}>
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
