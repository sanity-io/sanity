import {Flex, Stack, Text} from '@sanity/ui'
// A marked title is a node, and the ui-components wrapper takes `text` as a string only. Same
// reason, and the same raw import, as `GlobalPerspectiveMenuItem` on the release side.
// oxlint-disable-next-line no-restricted-imports -- custom use for MenuItem not supported by ui-components
import {MenuItem as UIMenuItem} from '@sanity/ui/menu'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {MarkedLabel} from '../../../perspective/MarkedLabel'
import {stickyMenuHeadingStyle} from '../../../perspective/styles'
import {useDocumentVariantIds} from '../../hooks/useDocumentVariantIds'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {menuIconSpacer, suggestIconColor} from './VariantsNav.css'

const SectionHeader = styled(Text)`
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

// This menu pins nothing above its headings, so the shared offset resolves to its
// `0px` fallback. Sharing the helper with the release menu keeps the two in step
// if a pinned filter is ever added here.
const StickyHeading = styled.div`
  ${stickyMenuHeadingStyle}
`

function VariantSectionHeader({children}: {children: string}): React.JSX.Element {
  return (
    <StickyHeading>
      <Box paddingX={2}>
        <Flex paddingTop={3} paddingBottom={2} gap={2} paddingLeft={3}>
          {/* Spacer for icon alignment */}
          <Box className={menuIconSpacer} />
          <Box>
            <SectionHeader muted size={0} weight="medium">
              {children}
            </SectionHeader>
          </Box>
        </Flex>
      </Box>
    </StickyHeading>
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
      paddingLeft={3}
      paddingRight={3}
      paddingY={3}
      pressed={isSelected}
      selected={isSelected}
    >
      {/* The layout mirrors `ui-components/MenuItem` exactly - the same Flex, gap, paddings and
          text size - so the row is unchanged to look at. Only the title differs, and it has to,
          because a marked title is a node and that wrapper's `text` takes a string. */}
      <Flex align="center" gap={2}>
        <Box paddingRight={1}>
          {/* Two nested Texts, as the wrapper has them: it renders the caller's icon element
              inside its own `size={1}` Text, and that outer size is what sets the row's line
              height. Collapsing them into one made the row 2px taller. */}
          <Text size={1}>
            <Text size={2} className={suggestIconColor}>
              <Icon />
            </Text>
          </Text>
        </Box>
        <Stack flex={1} gap={2}>
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
      paddingLeft={3}
      paddingRight={3}
      paddingY={3}
      pressed={isSelected}
      selected={isSelected}
    >
      <Flex align="center" gap={2}>
        <Box paddingRight={1}>
          <Text size={1}>
            <Text size={2} className={suggestIconColor}>
              <Icon />
            </Text>
          </Text>
        </Box>
        <Stack flex={1} gap={2}>
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
    <Box paddingX={2}>
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
    </Box>
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
    <>
      {heading && <VariantSectionHeader>{heading}</VariantSectionHeader>}
      <VariantList
        variants={variants}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        filled={false}
        searchTerm={searchTerm}
      />
    </>
  )
}

function DocumentVariantSections({
  documentId,
  variants,
  selectedVariantId,
  onSelect,
  searchTerm,
}: SectionsProps & {documentId: string}): React.JSX.Element | null {
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
        variants={others}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        searchTerm={searchTerm}
      />
    )
  }

  return (
    <>
      <VariantSectionHeader>{t('navbar.variant.has', {count: has.length})}</VariantSectionHeader>
      <VariantList
        variants={has}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        filled
        searchTerm={searchTerm}
      />
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
    <Box paddingX={2}>
      <DefaultVariantMenuItem
        // Filled once a document is selected: the default is the first version it ever had.
        icon={documentId ? RhombusIcon : RhombusOutlinedIcon}
        isSelected={isDefaultSelected}
        label={defaultLabel}
        onSelect={onSelectDefault}
        searchTerm={rest.searchTerm}
      />
    </Box>
  ) : null

  // No definitions at all. The label still appears, because a workspace with none is where a
  // reader most needs telling what the list would hold; the message says why it is empty. Not
  // shown while filtering - a filter matching nothing is a different state, and saying "none
  // created yet" there would be false.
  if (rest.variants.length === 0 && !isFiltering) {
    return (
      <>
        {defaultRow}
        <VariantSectionHeader>{t('navbar.variant.list')}</VariantSectionHeader>
        <Box paddingX={2} paddingBottom={2}>
          <Text muted size={1} data-testid="variant-menu-none-yet">
            {t('navbar.variant.none-yet')}
          </Text>
        </Box>
      </>
    )
  }

  return (
    <>
      {defaultRow}
      {documentId ? (
        <DocumentVariantSections documentId={documentId} {...rest} />
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
