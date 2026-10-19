import {ArrowLeftIcon} from '@sanity/icons/ArrowLeft'
import {Card, Flex, Text} from '@sanity/ui'
import {type ComponentType, type ReactNode} from 'react'
import {usePaneRouter} from 'sanity/structure'

import {useVersionList} from '../data/useVersionList'
import {PageVersionLabel, pageVersion, usePresentationAudience} from './pageVersion'

/**
 * The document form's context line in Presentation (P2): which audience's version this form shows ("German ·
 * draft"), and "On this page" back to the list of documents on the page. Renders nothing outside Presentation, or
 * without a chosen audience.
 */
export function PresentationContextLine({documentId}: {documentId: string}) {
  const audience = usePresentationAudience()
  const versions = useVersionList(documentId, !!audience)
  const Back = usePaneRouter().BackLink as unknown as ComponentType<{children?: ReactNode; style?: React.CSSProperties}>
  if (!audience || !versions) return null
  const version = pageVersion(versions, audience.variantId, audience.title, audience.perspective)
  return (
    <Card borderBottom data-testid="presentation-context-line" paddingX={3} paddingY={2} tone="transparent">
      <Flex align="center" gap={3}>
        <Text as="span" size={1}>
          <Back style={{alignItems: 'center', color: 'inherit', display: 'inline-flex', gap: 4, textDecoration: 'none'}}>
            <ArrowLeftIcon /> On this page
          </Back>
        </Text>
        <PageVersionLabel version={version} />
      </Flex>
    </Card>
  )
}
