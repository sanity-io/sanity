import {DiamondIcon} from '@sanity/icons/Diamond'
import {StackIcon} from '@sanity/icons/Stack'
import {Box, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type KeyboardEvent, useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {type SystemVariant} from '../../types'
import {
  summarizeVariantDimensions,
  type VariantGroupSummary,
} from '../../util/summarizeVariantDimensions'
import {getVariantId} from '../util'

// Clickable, bounded card in the Studio idiom (mirrors Tasks' FocusableCard): a focusable
// div rather than `as="button"`, so Card keeps its padding/radius/tone box props. Explicit
// resting border, strengthened on hover/focus.
const DimensionCard = styled(Card)`
  &[data-as='button'] {
    border: 1px solid var(--card-border-color);
    cursor: pointer;
  }
  &[data-as='button']:hover,
  &[data-as='button']:focus-visible {
    border-color: var(--card-focus-ring-color);
  }
`

function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`
}

/** Identity-only stat line — deliberately excludes values (those live in list/detail). */
function statLine(group: VariantGroupSummary): string {
  const dims = pluralize(group.dimensions.length, 'dimension')
  return group.kind === 'set'
    ? `${pluralize(group.variantCount, 'variant')} · ${dims}`
    : `Standalone · ${dims}`
}

/**
 * Card view of the variant space: uniform, identity-only tiles clustered by set. Shows
 * name + type icon (set vs single) + a stat line + the dimension *keys* — values are
 * deliberately omitted so every card is the same height and stays readable; values live
 * in the list view and the detail page. Selecting a card opens its detail page. FH-116.
 */
export function VariantDimensionMap(props: {
  variants: SystemVariant[]
  searchQuery?: string
}): React.JSX.Element | null {
  const {variants, searchQuery = ''} = props
  const router = useRouter()

  const openGroup = useCallback(
    (representativeVariantId: string) => {
      router.navigate({variantId: getVariantId(representativeVariantId)})
    },
    [router],
  )

  const groups = useMemo(() => summarizeVariantDimensions(variants), [variants])

  const query = searchQuery.trim().toLowerCase()
  const visibleGroups = useMemo(
    () => (query ? groups.filter((group) => group.name.toLowerCase().includes(query)) : groups),
    [groups, query],
  )

  if (groups.length === 0) {
    return null
  }

  return (
    <Grid columns={[1, 2, 3]} gap={3} style={{alignItems: 'start'}}>
      {visibleGroups.map((group) => {
        const keys = group.dimensions.map((dimension) => dimension.key)
        return (
          <DimensionCard
            key={group.id}
            data-as="button"
            onClick={() => openGroup(group.representativeVariantId)}
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                openGroup(group.representativeVariantId)
              }
            }}
            padding={4}
            radius={3}
            role="button"
            tabIndex={0}
            tone="transparent"
          >
            <Flex align="flex-start" gap={3}>
              <Text muted size={3}>
                {group.kind === 'set' ? <StackIcon /> : <DiamondIcon />}
              </Text>
              <Stack flex={1} space={3} style={{minWidth: 0}}>
                <Text size={1} textOverflow="ellipsis" weight="semibold">
                  {group.name}
                </Text>
                <Text muted size={1} textOverflow="ellipsis">
                  {statLine(group)}
                </Text>
                <Text muted size={1} textOverflow="ellipsis">
                  {keys.length > 0 ? keys.join(' · ') : 'All users'}
                </Text>
              </Stack>
            </Flex>
          </DimensionCard>
        )
      })}
      {visibleGroups.length === 0 && (
        <Box>
          <Text muted size={1}>
            No sets or variants match “{searchQuery}”.
          </Text>
        </Box>
      )}
    </Grid>
  )
}
