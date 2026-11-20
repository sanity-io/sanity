import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {createMockVariant} from '../../../../variants/__fixtures__/createMockVariant'
import {variantAlphaAudience} from '../../../../variants/__fixtures__/variants.fixture'
import {type SystemVariant} from '../../../../variants/types'
import {MemoVariantCell} from '../VariantCell'

const UNTITLED: SystemVariant = createMockVariant('vip-users')

const LONG_TITLE: SystemVariant = {
  ...createMockVariant('very-long-name'),
  conditions: {audience: 'everyone', locale: 'en-US'},
  metadata: {
    title: 'A very long variant name that should ellipsis in a narrow column',
  },
}

function Label({children}: {children: string}) {
  return (
    <Text muted size={1} weight="medium" as="div" trim={true}>
      {children}
    </Text>
  )
}

/**
 * Chromatic sentinel for the releases-table variant cell after the ui5 Icon /
 * Text migration: the suggest-tone diamond, the title (or id-suffix fallback),
 * and truncation in a narrow column. Tooltips stay closed; conditions only
 * affect whether a tooltip exists, not the row paint.
 */
export function VariantCellStory() {
  return (
    <Card padding={4} style={{maxWidth: 360}}>
      <VStack gap={5}>
        <VStack gap={2}>
          <Label>titled</Label>
          <MemoVariantCell variant={variantAlphaAudience} />
        </VStack>
        <VStack gap={2}>
          <Label>untitled (id suffix)</Label>
          <MemoVariantCell variant={UNTITLED} />
        </VStack>
        <VStack gap={2}>
          <Label>truncated</Label>
          <div style={{width: 160}}>
            <MemoVariantCell variant={LONG_TITLE} />
          </div>
        </VStack>
      </VStack>
    </Card>
  )
}
