import {DocumentIcon} from '@sanity/icons'
import {Flex, Text, TextSkeleton, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {forwardRef, useMemo} from 'react'
import {IntentLink} from 'sanity/router'

import {useSchema} from '../../../hooks'
import {usePerspective} from '../../../perspective/usePerspective'
import {useDocumentPreviewValues} from '../../hooks'
import * as classes from './DocumentPreview.css'

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
  const theme = useThemeV2()

  const Link = useMemo(
    () =>
      forwardRef(function LinkComponent(linkProps, ref: React.ForwardedRef<HTMLAnchorElement>) {
        return (
          <IntentLink
            {...linkProps}
            className={classes.styledIntentLink}
            style={assignInlineVars({
              [classes.decorationColorVar]: theme.color.input.default.enabled.border,
            })}
            intent="edit"
            params={{id: documentId, type: documentType}}
            ref={ref}
          />
        )
      }),
    [documentId, documentType, theme],
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
