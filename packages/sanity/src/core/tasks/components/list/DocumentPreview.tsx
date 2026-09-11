import {DocumentIcon} from '@sanity/icons/Document'
import {Text, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {clsx} from 'clsx'
import {useMemo, type RefAttributes} from 'react'
import {IntentLink} from 'sanity/router'
import {Flex} from 'ui5'

import {useSchema} from '../../../hooks/useSchema'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../hooks/useDocumentPreviewValues'
import {inputBorderColorVar, styledIntentLink} from './DocumentPreview.css'

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
  const {color} = useThemeV2()
  const inputBorderColor = color.input.default.enabled.border

  const Link = useMemo(
    () =>
      function LinkComponent(
        linkProps: React.ComponentPropsWithoutRef<'a'> & RefAttributes<HTMLAnchorElement>,
      ) {
        const {className, ref, ...rest} = linkProps
        return (
          <IntentLink
            {...rest}
            className={clsx(styledIntentLink, className)}
            intent="edit"
            params={{id: documentId, type: documentType}}
            ref={ref}
          />
        )
      },
    [documentId, documentType],
  )

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
          as={Link}
          weight="medium"
          style={{maxWidth: '20ch', ...assignInlineVars({[inputBorderColorVar]: inputBorderColor})}}
          textOverflow="ellipsis"
        >
          {value?.title || 'Untitled'}
        </Text>
      )}
    </Flex>
  )
}
