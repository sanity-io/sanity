import {Card, Label, Stack, Text} from '@sanity/ui'
// A marked title is a node, and the ui-components wrapper takes `text` as a string only. Same
// reason, and the same raw import, as `GlobalPerspectiveMenuItem` on the release side.
// oxlint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {MenuItem as UIMenuItem} from '@sanity/ui/menu'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {Box, Flex} from 'ui5'

import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {MarkedLabel} from '../../../perspective/MarkedLabel'
import {stickyMenuHeadingStyle} from '../../../perspective/styles'
import {useDocumentVariantIds} from '../../hooks/useDocumentVariantIds'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {suggestIconColor} from './VariantsNav.css'

/**
 * Rebuilt on the release menu's own structure, so the two read as one component family: the same
 * sticky heading, the same 4px section card, the same row internals. Divergent spacing here was
 * not a set of independent gaps but one structural difference repeated in every row.
 */
const StickyHeading = styled.div`
  ${stickyMenuHeadingStyle}
`

function VariantSectionHeader({children}: {children: string}): React.JSX.Element {
  return (
    <StickyHeading>
      <Box paddingLeft={2} paddingTop={3} paddingBottom={2}>
        <Label muted style={{textTransform: 'uppercase'}} size={1}>
          {children}
        </Label>
      </Box>
    </StickyHeading>
  )
}

/**
 * A section: one card, one hairline, an optional heading and the rows under it.
 *
 * The stack sets no gap and the heading carries the space below it as padding instead, as on the
 * release side - a gap leaves a transparent strip that rows flicker through while scrolling under
 * the pinned heading.
 */
function VariantSectionCard({
  children,
  heading,
  'data-testid': dataTestId,
}: {
  'children': React.ReactNode
  'heading'?: string
  'data-testid'?: string
}): React.JSX.Element {
  return (
    <Card padding={1} borderBottom data-testid={dataTestId}>
      <Stack gap={0}>
        {heading && <VariantSectionHeader>{heading}</VariantSectionHeader>}
        {children}
      </Stack>
    </Card>
  )
}

interface VariantListProps {
  variants: SystemVariant[]
  selectedVariantId: string | undefined
  onSelect: (variant: SystemVariant) => void
  /** Filled rhombus means the selected document already has this variant. */
  filled: boolean
  searchTerm?: string
}

function VariantMenuItem(props: {
  isSelected: boolean
  onSelect: (variant: SystemVariant) => void
  variant: SystemVariant
  icon: React.ComponentType
  /** The active filter term. Its occurrences are marked inside the variant title. */
  searchTerm?: string
}): React.JSX.Element {
  const {isSelected, onSelect, variant, icon: Icon, searchTerm} = props

  return (
    <UIMenuItem
      data-testid={`variant-${getVariantId(variant._id)}`}
      onClick={() => onSelect(variant)}
      padding={1}
      pressed={isSelected}
      selected={isSelected}
    >
      {/* The row's internals are `GlobalPerspectiveMenuItem`'s, element for element: `padding={1}`
          on the item, `gap={1}` on the flex, and the icon's own 4px on each side. That is what puts
          the icon 12px from the panel edge - 4px from the section card, 4px from the row, 4px here -
          and 8px from the title. This menu had `paddingX={3}` on the row inside a `paddingX={2}`
          box, which is 20px, and the difference was visible with the two menus side by side. */}
      <Flex alignItems="flex-start" gap={1}>
        <Box
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          paddingLeft={1}
          paddingRight={1}
          paddingY={2}
        >
          <Text className={suggestIconColor} size={2}>
            <Icon />
          </Text>
        </Box>
        <Stack flex={1} paddingY={2} paddingRight={2} gap={2} style={{minWidth: 0}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            <MarkedLabel label={getVariantTitle(variant)} searchTerm={searchTerm} />
          </Text>
        </Stack>
      </Flex>
    </UIMenuItem>
  )
}

/**
 * The default row. Structurally `VariantMenuItem`, but carrying a translated label instead of a
 * variant, and no variant to select - so it takes the label and the handler directly.
 */
function DefaultVariantMenuItem({
  icon: Icon,
  isSelected,
  label,
  onSelect,
  searchTerm,
}: {
  icon: React.ComponentType
  isSelected: boolean
  label: string
  onSelect: () => void
  searchTerm?: string
}): React.JSX.Element {
  return (
    <UIMenuItem
      data-testid="variant-default"
      onClick={onSelect}
      padding={1}
      pressed={isSelected}
      selected={isSelected}
    >
      {/* `VariantMenuItem`'s internals, for the reasons given there. */}
      <Flex alignItems="flex-start" gap={1}>
        <Box
          flexBasis="auto"
          flexGrow={0}
          flexShrink={0}
          paddingLeft={1}
          paddingRight={1}
          paddingY={2}
        >
          <Text className={suggestIconColor} size={2}>
            <Icon />
          </Text>
        </Box>
        <Stack flex={1} paddingY={2} paddingRight={2} gap={2} style={{minWidth: 0}}>
          <Text size={1} textOverflow="ellipsis" weight="medium">
            <MarkedLabel label={label} searchTerm={searchTerm} />
          </Text>
        </Stack>
      </Flex>
    </UIMenuItem>
  )
}

function VariantList({
  variants,
  selectedVariantId,
  onSelect,
  filled,
  searchTerm,
}: VariantListProps): React.JSX.Element {
  const Icon = filled ? RhombusIcon : RhombusOutlinedIcon

  return (
    <Flex flexDirection="column" gap={1}>
      {variants.map((variant) => (
        <VariantMenuItem
          key={variant._id}
          isSelected={selectedVariantId === variant._id}
          onSelect={onSelect}
          variant={variant}
          icon={Icon}
          searchTerm={searchTerm}
        />
      ))}
    </Flex>
  )
}

interface SectionsProps {
  variants: SystemVariant[]
  selectedVariantId: string | undefined
  onSelect: (variant: SystemVariant) => void
  /** The active filter term, or undefined. Marked inside each variant title. */
  searchTerm?: string
}

/**
 * Whether a label survives the filter.
 *
 * Must agree with {@link rankVariantsForSearch}'s notion of a match: every tier it ranks - exact,
 * prefix and substring - is a substring match, so this is the same test without the ordering.
 */
function matchesSearchTerm(label: string, searchTerm: string | undefined): boolean {
  const normalized = searchTerm?.trim().toLowerCase()

  return !normalized || label.toLowerCase().includes(normalized)
}

/**
 * The variants the selected document does not have — or, with nothing selected,
 * simply all of them.
 *
 * The heading is supplied by the caller rather than baked in, mirroring
 * `ReleaseTypeMenuSection` on the release side. "Other" only means something when
 * a "has" section sits above it, so the default state and the no-variants
 * fallback render the list unheaded.
 */
function OtherVariantsSection({
  variants,
  selectedVariantId,
  onSelect,
  heading,
  searchTerm,
}: SectionsProps & {heading?: string}): React.JSX.Element | null {
  if (variants.length === 0) return null

  return (
    <VariantSectionCard heading={heading}>
      <VariantList
        variants={variants}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        filled={false}
        searchTerm={searchTerm}
      />
    </VariantSectionCard>
  )
}

function DocumentVariantSections({
  documentId,
  variants,
  selectedVariantId,
  onSelect,
  searchTerm,
  unsplitHeading,
}: SectionsProps & {
  documentId: string
  /**
   * The heading for the case where the document has no variants and there is nothing to split.
   * That state has to read identically to having no document open, label included - without it,
   * selecting a document silently drops the label and the list looks like a different component.
   */
  unsplitHeading?: string
}): React.JSX.Element | null {
  const {t} = useTranslation(variantsLocaleNamespace)
  const documentVariantIds = useDocumentVariantIds(documentId)

  const [has, others] = useMemo(
    () => [
      variants.filter((variant) => documentVariantIds.has(variant._id)),
      variants.filter((variant) => !documentVariantIds.has(variant._id)),
    ],
    [documentVariantIds, variants],
  )

  if (has.length === 0) {
    return (
      <OtherVariantsSection
        heading={unsplitHeading}
        variants={others}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        searchTerm={searchTerm}
      />
    )
  }

  return (
    <>
      <VariantSectionCard heading={t('navbar.variant.has', {count: has.length})}>
        <VariantList
          variants={has}
          selectedVariantId={selectedVariantId}
          onSelect={onSelect}
          filled
          searchTerm={searchTerm}
        />
      </VariantSectionCard>
      <OtherVariantsSection
        heading={t('navbar.variant.other')}
        variants={others}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        searchTerm={searchTerm}
      />
    </>
  )
}

/**
 * The variant list, split into "Has N variants" and "Other variants" when the
 * selected document has at least one. Otherwise a single unheaded list.
 *
 * `DocumentVariantSections` is a separate component so `useDocumentVersions` is
 * only ever called with a real id — it has no empty-id guard and would otherwise
 * open a version subscription for `''`.
 *
 * @internal
 */
export function VariantsMenuSections({
  documentId,
  isDefaultSelected,
  onSelectDefault,
  ...rest
}: SectionsProps & {
  documentId: string | undefined
  isDefaultSelected: boolean
  onSelectDefault: () => void
}): React.JSX.Element | null {
  const {t} = useTranslation(variantsLocaleNamespace)
  const defaultLabel = t('navbar.variant.default')
  const isFiltering = (rest.searchTerm ?? '').trim().length > 0

  // The default row sits inside the list rather than above it, so the filter reaches it and its
  // term is marked - the same treatment published and drafts have in the release menu. Rendered
  // here rather than in `VariantsMenu` for exactly that reason: a row rendered outside the
  // sections is a row the filter cannot see.
  const defaultRow = matchesSearchTerm(defaultLabel, rest.searchTerm) ? (
    <VariantSectionCard>
      <DefaultVariantMenuItem
        // Filled once a document is selected: the default is the first version it ever had.
        icon={documentId ? RhombusIcon : RhombusOutlinedIcon}
        isSelected={isDefaultSelected}
        label={defaultLabel}
        onSelect={onSelectDefault}
        searchTerm={rest.searchTerm}
      />
    </VariantSectionCard>
  ) : null

  // Filtered to nothing, with the default row excluded too, so there is no row left to show.
  // Distinct from having no definitions at all, handled below: this state is about the term.
  if (isFiltering && rest.variants.length === 0 && !defaultRow) {
    return (
      <Card padding={4}>
        <Text align="center" muted size={1} data-testid="variant-menu-no-results">
          {t('navbar.variant.no-results', {searchTerm: (rest.searchTerm ?? '').trim()})}
        </Text>
      </Card>
    )
  }

  // No definitions at all. The label still appears, because a workspace with none is where a
  // reader most needs telling what the list would hold; the message says why it is empty. Not
  // shown while filtering - a filter matching nothing is a different state, and saying "none
  // created yet" there would be false.
  if (rest.variants.length === 0 && !isFiltering) {
    return (
      <>
        {defaultRow}
        <VariantSectionCard heading={t('navbar.variant.list')}>
          {/* 8px above and below the message, and the same 8px inset the heading has - the
              release menu's empty state element for element. */}
          <Box paddingLeft={2} paddingTop={2} paddingBottom={2}>
            <Text muted size={1} data-testid="variant-menu-none-yet">
              {t('navbar.variant.none-yet')}
            </Text>
          </Box>
        </VariantSectionCard>
      </>
    )
  }

  return (
    <>
      {defaultRow}
      {documentId ? (
        <DocumentVariantSections
          documentId={documentId}
          unsplitHeading={isFiltering ? undefined : t('navbar.variant.list')}
          {...rest}
        />
      ) : (
        // Labelled `Variants` unless a filter is active, where the list is a set of results and a
        // heading over them explains nothing. The document-selected path labels itself.
        <OtherVariantsSection
          heading={isFiltering ? undefined : t('navbar.variant.list')}
          {...rest}
        />
      )}
    </>
  )
}
