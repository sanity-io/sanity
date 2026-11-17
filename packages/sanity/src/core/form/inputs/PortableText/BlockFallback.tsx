import {Card, Skeleton, TextSkeleton} from '@sanity/ui'
import {Box, Flex, type PaddingProps} from 'ui5'

import {PREVIEW_SIZES} from '../../../components/previews/constants'
import {TEXT_STYLE_PADDING} from './text/constants'

interface BlockFallbackProps {
  hasBlockActions: boolean
  isFullscreen: boolean
  /** A path deeper than the root array means the block is nested in a container. */
  nested: boolean
}

/** The horizontal gutter `TextBlock` and `BlockObject` give a top-level block. */
function gutter({hasBlockActions, isFullscreen, nested}: BlockFallbackProps): PaddingProps {
  if (nested) return {paddingX: 0}
  if (isFullscreen) return hasBlockActions ? {paddingLeft: 5, paddingRight: 2} : {paddingX: 5}
  return hasBlockActions ? {paddingLeft: 3, paddingRight: 2} : {paddingX: 3}
}

/**
 * Stands in for a text block while its lazy block component loads: one line at the block's
 * vertical spacing, so the blocks around it stay roughly where they are.
 */
export function TextBlockFallback(
  props: BlockFallbackProps & {listItem?: string; style?: string},
): React.JSX.Element {
  const {listItem, style, ...gutterProps} = props
  const outerPadding: PaddingProps = listItem
    ? {paddingY: 2}
    : TEXT_STYLE_PADDING[style || 'normal'] || {paddingY: 2}

  return (
    <Box {...outerPadding} contentEditable={false} data-testid="text-block-fallback">
      <Box {...gutter(gutterProps)}>
        <TextSkeleton animated radius={1} size={2} style={{width: '60%'}} />
      </Box>
    </Box>
  )
}

/**
 * Stands in for a block object while its lazy block component loads: the bordered card with a
 * preview row, at the spacing `BlockObject` uses.
 */
export function BlockObjectFallback(props: BlockFallbackProps): React.JSX.Element {
  return (
    <Box contentEditable={false} data-testid="block-object-fallback">
      <Flex marginY={3} paddingBottom={1}>
        <Box flexBasis="0%" flexGrow={1} {...gutter(props)}>
          <Card border padding={1} radius={1}>
            <Flex alignItems="center" gap={2} padding={2}>
              <Skeleton animated radius={1} style={PREVIEW_SIZES.block.media} />
              <TextSkeleton animated radius={1} size={1} style={{width: 160}} />
            </Flex>
          </Card>
        </Box>
      </Flex>
    </Box>
  )
}
