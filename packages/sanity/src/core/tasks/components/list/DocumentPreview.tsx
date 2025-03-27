import {DocumentIcon} from '@sanity/icons'
import {Flex, Text, TextSkeleton} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useSchema} from '../../../hooks'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../hooks'

const StyledIntentLink = styled(IntentLink)((props) => {
  return `
  text-decoration: underline;
  text-decoration-color: ${vars.color.tinted.default.border[1]};
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
  const {perspectiveStack} = usePerspective()
  const {isLoading, value} = useDocumentPreviewValues({
    documentId,
    documentType,
    perspectiveStack,
  })

  const Link = useMemo(
    () =>
      forwardRef(function LinkComponent(
        linkProps: React.ComponentProps<'a'>,
        ref: React.ForwardedRef<HTMLAnchorElement>,
      ) {
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
        <TextSkeleton
          size={1}
          // @ts-expect-error - TODO: fix this in `@sanity/ui`
          muted
        />
      ) : (
        <Text size={1} as={Link} weight="medium" style={{maxWidth: '20ch'}} textOverflow="ellipsis">
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
