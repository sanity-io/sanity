import {Badge, Card, Flex, Grid, Stack, Text} from '@sanity/ui'
import {type KeyboardEvent, useCallback, useMemo} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {
  buildConditionSuggestionIndex,
  getConditionKeyProvenance,
} from '../../components/dialog/conditionSuggestions'
import {type SystemVariant} from '../../types'
import {summarizeVariantDimensions} from '../../util/summarizeVariantDimensions'
import {getStubVariantDimensionMap} from '../../util/variantDimensionMap'
import {getVariantId} from '../util'

// How many values to show inline on a compact tile before collapsing to a "+n" count.
const MAX_VALUES_PER_DIMENSION = 6

// Clickable, bounded card in the Studio idiom (mirrors Tasks' FocusableCard): a focusable
// div rather than `as="button"`, so Card keeps its padding/radius/tone box props. Explicit
// resting border, strengthened on hover/focus, so tiles read as ordered, tappable units.
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

/**
 * Dimension-first map of the variant space as a grid of compact tiles — the entry
 * point to the definitions. Answers "what dimensions am I playing with?" at a
 * glance, then closes the loop: selecting a card opens the detail page for that set
 * (its first member) or standalone variant. FH-116 conceptual prototype.
 */
export function VariantDimensionMap(props: {variants: SystemVariant[]}): React.JSX.Element | null {
  const {variants} = props
  const router = useRouter()

  const openGroup = useCallback(
    (representativeVariantId: string) => {
      router.navigate({variantId: getVariantId(representativeVariantId)})
    },
    [router],
  )

  const groups = useMemo(() => summarizeVariantDimensions(variants), [variants])
  const index = useMemo(
    () => buildConditionSuggestionIndex(variants, getStubVariantDimensionMap()),
    [variants],
  )

  if (groups.length === 0) {
    return null
  }

  return (
    <Stack space={4}>
      <Stack space={2}>
        <Text size={1} weight="semibold">
          Dimension map
        </Text>
        <Text muted size={1}>
          The dimensions in play, clustered by set. Select a card to open its definitions.
        </Text>
      </Stack>

      {/* alignItems:start stops the grid stretching cards to the tallest in a row; each card
          hugs its content so every title pins to the top (Card as="button" otherwise centers
          its content vertically within a stretched card). */}
      <Grid columns={[1, 2, 3]} gap={3} style={{alignItems: 'start'}}>
        {groups.map((group) => (
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
            <Stack space={3}>
              <Flex align="flex-start" gap={2} justify="space-between">
                <Text size={1} weight="semibold" textOverflow="ellipsis">
                  {group.name}
                </Text>
                <Badge
                  fontSize={0}
                  mode="outline"
                  tone={group.kind === 'set' ? 'primary' : 'default'}
                >
                  {group.kind === 'set' ? `${group.variantCount}` : 'single'}
                </Badge>
              </Flex>

              {group.dimensions.length === 0 ? (
                <Text muted size={0}>
                  All users
                </Text>
              ) : (
                <Stack space={3}>
                  {group.dimensions.map((dimension) => {
                    const provenance = getConditionKeyProvenance(index, dimension.key)
                    const shown = dimension.values.slice(0, MAX_VALUES_PER_DIMENSION)
                    const overflow = dimension.values.length - shown.length
                    return (
                      <Stack key={dimension.key} space={2}>
                        <Flex align="center" gap={2}>
                          <Text size={0} weight="medium">
                            {dimension.key}
                          </Text>
                          <Text muted size={0}>
                            {provenance.source}
                          </Text>
                        </Flex>
                        <Flex gap={1} wrap="wrap">
                          {shown.map((value) => (
                            <Badge key={value} fontSize={0} mode="outline" tone="default">
                              {value}
                            </Badge>
                          ))}
                          {overflow > 0 && (
                            <Badge fontSize={0} tone="default">{`+${overflow}`}</Badge>
                          )}
                        </Flex>
                      </Stack>
                    )
                  })}
                </Stack>
              )}
            </Stack>
          </DimensionCard>
        ))}
      </Grid>
    </Stack>
  )
}
