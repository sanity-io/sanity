import {Flex, Text} from '@sanity/ui'
import {useMemo} from 'react'
import {styled} from 'styled-components'
import {Box} from 'ui5'

import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {useDocumentVersions} from '../../../releases/hooks/useDocumentVersions'
import {variantsLocaleNamespace} from '../../i18n'
import {getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {menuIconSpacer, suggestIconColor} from './VariantsNav.css'

const SectionHeader = styled(Text)`
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

function VariantSectionHeader({children}: {children: string}): React.JSX.Element {
  return (
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
  )
}

interface VariantListProps {
  variants: SystemVariant[]
  selectedVariantId: string | undefined
  onSelect: (variant: SystemVariant) => void
  /** Filled diamond means the selected document already has this variant. */
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

/** The flat list as it reads when nothing narrows it down to one document. */
function OtherVariantsOnly({
  variants,
  selectedVariantId,
  onSelect,
  filled = false,
}: SectionsProps & {filled?: boolean}): React.JSX.Element | null {
  const {t} = useTranslation(variantsLocaleNamespace)

  if (variants.length === 0) return null

  return (
    <>
      <VariantSectionHeader>{t('navbar.variant.other')}</VariantSectionHeader>
      <VariantList
        variants={variants}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
        filled={filled}
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
  const {versions} = useDocumentVersions({documentId})

  // A variant version of a document is identified by `_system.variant`, not by
  // anything in its id — see `getVariantVersionInfo`.
  const documentVariantIds = useMemo(() => {
    const refs = versions
      .map((version) => version._system.variant?._ref)
      .filter((ref): ref is string => typeof ref === 'string')
    return new Set(refs)
  }, [versions])

  const [has, others] = useMemo(
    () => [
      variants.filter((variant) => documentVariantIds.has(variant._id)),
      variants.filter((variant) => !documentVariantIds.has(variant._id)),
    ],
    [documentVariantIds, variants],
  )

  if (has.length === 0) {
    return (
      <OtherVariantsOnly
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
      <OtherVariantsOnly
        variants={others}
        selectedVariantId={selectedVariantId}
        onSelect={onSelect}
      />
    </>
  )
}

/**
 * The variant list, split into "Has N variants" and "Other variants" when a
 * document is selected.
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

  return <OtherVariantsOnly {...rest} />
}
