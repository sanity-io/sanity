import {Box, Button, Card, Flex, Text} from '@sanity/ui'
import {useDocumentOperation} from 'sanity'

import {useVersionList} from '../data/useVersionList'

/**
 * C7 V1 (banners), live data. Option A: an explicit banner always states the version and, when there is a draft,
 * offers "Publish this draft" (a real publish, run only when clicked). Option B: no banner; a small hint says edits
 * are live in Drafts. Figma C7 225:437 and 225:441.
 */
export function DocumentBannerV1({documentId, documentType, option}: {documentId: string; documentType: string; option: 'a' | 'b'}) {
  const versions = useVersionList(documentId)
  const {publish} = useDocumentOperation(documentId, documentType)
  if (!versions) return null

  const draft = versions.some((v) => v.audience === null && v.state === 'draft')
  const published = versions.some((v) => v.audience === null && v.state === 'published')
  const others = versions.filter((v) => v.audience !== null || v.release).length

  if (option === 'b') {
    return (
      <Card data-testid="doc-banner-b" paddingX={3} paddingY={1} style={{borderBottom: '1px solid var(--card-border-color)'}} tone="transparent">
        <Text muted size={0}>Edits are live in Drafts. {others ? `${others} other version${others === 1 ? '' : 's'} of this document.` : ''}</Text>
      </Card>
    )
  }

  return (
    <Card data-testid="doc-banner-a" padding={3} style={{borderBottom: '1px solid var(--card-border-color)'}} tone={draft ? 'caution' : 'positive'}>
      <Flex align="center" gap={3}>
        <Box flex={1}>
        <Text size={1}>
          {draft
            ? published
              ? 'This draft has changes that are not published.'
              : 'This draft is not published yet.'
            : 'This document is published, with no unpublished changes.'}
          {others ? ` ${others} other version${others === 1 ? '' : 's'} exist (variants or releases).` : ''}
        </Text>
        </Box>
        {draft && (
          <Button
            disabled={Boolean(publish.disabled)}
            fontSize={1}
            onClick={() => publish.execute()}
            text="Publish this draft"
            tone="positive"
          />
        )}
      </Flex>
    </Card>
  )
}
