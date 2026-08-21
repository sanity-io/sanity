import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
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
}

function VariantList({
  variants,
  selectedVariantId,
  onSelect,
  filled,
}: VariantListProps): React.JSX.Element {
  const Icon = filled ? RhombusIcon : RhombusOutlinedIcon

  return (
    <Box paddingX={2}>
      {variants.map((variant) => {
        const isSelected = selectedVariantId === variant._id

        return (
          <MenuItem
            key={variant._id}
            data-testid={`variant-${getVariantId(variant._id)}`}
            icon={
              <Text size={2} className={suggestIconColor}>
                <Icon />
              </Text>
            }
            onClick={() => onSelect(variant)}
            pressed={isSelected}
            selected={isSelected}
            text={getVariantTitle(variant)}
          />
        )
      })}
    </Box>
  )
}

interface SectionsProps {
  variants: SystemVariant[]
  selectedVariantId: string | undefined
  onSelect: (variant: SystemVariant) => void
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
      />
    </>
  )
}

function DocumentVariantSections({
  documentId,
  variants,
  selectedVariantId,
  onSelect,
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
      />
      <OtherVariantsSection
        heading={t('navbar.variant.other')}
        variants={others}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
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
  ...rest
}: SectionsProps & {documentId: string | undefined}): React.JSX.Element | null {
  if (documentId) {
    return <DocumentVariantSections documentId={documentId} {...rest} />
  }

  return <OtherVariantsSection {...rest} />
}
