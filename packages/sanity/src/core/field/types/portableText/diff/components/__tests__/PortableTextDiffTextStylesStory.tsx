import {Card} from '@sanity/ui'
import {Text, VStack} from 'ui5'

import {Blockquote} from '../Blockquote'
import {Header} from '../Header'
import {Paragraph} from '../Paragraph'

const HEADING_STYLES = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const

/**
 * Chromatic sentinel for portable-text review-changes text chrome after the
 * ui5 Heading migration (and the drop of the v4 heading CSS overrides): h1–h6
 * map onto Heading sizes 2/1/0 with inline display, plus the paragraph wrap
 * and blockquote quote styles. Fixture copy only; no live diffs.
 */
export function PortableTextDiffTextStylesStory() {
  return (
    <Card padding={4} style={{maxWidth: 480}}>
      <VStack gap={5}>
        {HEADING_STYLES.map((style) => (
          <VStack key={style} gap={2}>
            <Text muted size={1} weight="medium" as="div" trim={true}>
              {style}
            </Text>
            {/* Header's `style` is the PT block style (h1–h6), not a CSS object. */}
            <Header {...{style}}>{style} heading fixture</Header>
          </VStack>
        ))}
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            wrapping h1
          </Text>
          <Header {...{style: 'h1'}}>
            A long heading that wraps onto a second line in this card
          </Header>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            paragraph
          </Text>
          <Paragraph>A paragraph of fixture copy that wraps onto the next line.</Paragraph>
        </VStack>
        <VStack gap={2}>
          <Text muted size={1} weight="medium" as="div" trim={true}>
            blockquote
          </Text>
          <Blockquote>A quoted block of fixture copy.</Blockquote>
        </VStack>
      </VStack>
    </Card>
  )
}
