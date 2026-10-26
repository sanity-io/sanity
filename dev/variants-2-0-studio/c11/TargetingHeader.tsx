import {Box, Card, Flex, Skeleton, Stack, Text} from '@sanity/ui'
import {Fragment, type ReactNode, useMemo} from 'react'
import {getVariantTitle, RelativeTime, type VariantDetailHeaderProps} from 'sanity'

import {getVariantConditionIcon} from '../../../packages/sanity/src/core/variants/tool/detail/variantConditionIcons'
import {getVariantDescription} from '../../../packages/sanity/src/core/variants/tool/util'

/**
 * C11 B "Targeting header" (David, 26 Oct): the variant detail page header as ONE left-aligned column, read top to bottom.
 *  - title, then "Created 6 days ago" as quiet muted text, then the description;
 *  - one "Targeting" block (no second "Details" panel): each condition as a sentence ("Audience is members"), an "and"
 *    between dimensions (dimensions combine with AND), "is any of" when a value is a list (values within one dimension are OR),
 *    and the priority as a line under them;
 *  - "Documents with this variant" and the count, as the heading of the table below.
 * Dropped: "Total documents" (the count moves to the table heading) and "Unpublished changes" (no cheap table filter).
 * Colour pairs (measured from the studio's theme, both schemes): text fg and muted fg on the default card only. The block
 * has a border, not the transparent tone's grey fill.
 */
export function TargetingHeader({
  variant,
  documentCount,
  documentsLoading,
}: VariantDetailHeaderProps) {
  const title = getVariantTitle(variant)
  const description = getVariantDescription(variant)
  // Each dimension's glyph, built inside a memo as the stock page builds its condition rows.
  const conditions = useMemo(
    () =>
      Object.entries(variant.conditions ?? {}).map(([key, value]) => {
        const DimensionIcon = getVariantConditionIcon(key)
        return {key, value: value as unknown, icon: <DimensionIcon />}
      }),
    [variant.conditions],
  )

  return (
    <Stack data-testid="variant-detail-targeting-header" gap={5}>
      <Stack gap={3}>
        <Text
          as="h1"
          data-testid="variant-title-display"
          size={4}
          textOverflow="ellipsis"
          title={title}
          weight="bold"
        >
          {title}
        </Text>
        <Text data-testid="variant-created" muted size={1}>
          Created <RelativeTime minimal time={variant._createdAt} useTemporalPhrase />
        </Text>
        {description ? (
          <Box style={{maxWidth: 560}}>
            <Text
              data-testid="variant-description-display"
              muted
              size={2}
              style={{whiteSpace: 'pre-wrap'}}
            >
              {description}
            </Text>
          </Box>
        ) : null}
      </Stack>

      <Card
        border
        data-testid="variant-detail-targeting"
        padding={4}
        radius={3}
        style={{maxWidth: 640}}
        tone="default"
      >
        <Stack gap={4}>
          <Text as="h2" size={1} weight="semibold">
            Targeting
          </Text>
          {conditions.length === 0 ? (
            <Text muted size={1}>
              No conditions
            </Text>
          ) : (
            <Stack as="ul" gap={3} style={{listStyle: 'none', margin: 0, padding: 0}}>
              {conditions.map(({key, value, icon}, index) => (
                <Fragment key={key}>
                  {index > 0 ? (
                    <Box as="li" paddingLeft={5}>
                      <Text muted size={1} weight="medium">
                        and
                      </Text>
                    </Box>
                  ) : null}
                  <ConditionSentence dimension={key} icon={icon} value={value} />
                </Fragment>
              ))}
            </Stack>
          )}
          <Text data-testid="variant-priority" muted size={1}>
            Priority {variant.priority}. When variants match equally, the higher priority wins.
          </Text>
        </Stack>
      </Card>

      <Flex align="center" data-testid="variant-documents-heading" gap={2}>
        <Text as="h2" size={1} weight="semibold">
          Documents with this variant
        </Text>
        {documentsLoading ? (
          <Skeleton animated radius={1} style={{width: 24, height: 11}} />
        ) : (
          <Text data-testid="variant-documents-count" muted size={1}>
            {documentCount}
          </Text>
        )}
      </Flex>
    </Stack>
  )
}

/** One condition as a sentence: "Audience is members", or "Locale is any of en-GB, es-ES" when the value is a list. */
function ConditionSentence({
  dimension,
  icon,
  value,
}: {
  dimension: string
  icon: ReactNode
  value: unknown
}) {
  // The model stores one string per dimension (SystemVariant['conditions']: Record<string, string>); a list is handled in
  // case the model grows one, so the OR inside a dimension can be read.
  const values = Array.isArray(value) ? value.map(String) : [String(value)]
  const label = dimension.charAt(0).toUpperCase() + dimension.slice(1)

  return (
    <Flex align="center" as="li" data-testid={`targeting-condition-${dimension}`} gap={3}>
      <Box flex="none" style={{width: 20}}>
        <Text muted size={1} align="center">
          {icon}
        </Text>
      </Box>
      <Text size={1}>
        <span style={{fontWeight: 600}}>{label}</span>{' '}
        <span style={{color: 'var(--card-muted-fg-color)'}}>
          {values.length > 1 ? 'is any of' : 'is'}
        </span>{' '}
        <span style={{fontWeight: 600}}>{values.join(', ')}</span>
      </Text>
    </Flex>
  )
}
