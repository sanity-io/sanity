import {DocumentsIcon} from '@sanity/icons/Documents'
import {Text} from '@sanity/ui'
import {type RefAttributes, type SVGProps, useCallback, useMemo, useState} from 'react'
import {
  DEFAULT_VARIANT_TYPE_KEY,
  filterVariantsForSearch,
  getReleaseIdFromReleaseDocumentId,
  getVariantTitle,
  getVariantType,
  isAgentBundleName,
  isDefaultVariant,
  LATEST,
  PUBLISHED,
  type SystemVariant,
  useActiveReleases,
  useAllVariants,
  useDocumentVersions,
  useListFormat,
  useSetVariant,
  useTranslation,
} from 'sanity'
import {Flex} from 'ui5'

import {MenuItem} from '../../../../../../../ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../../../../../i18n'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DropdownButton} from '../DropdownButton'
import {DocumentNavigationMenu} from '../menu/DocumentNavigationMenu'
import {RhombusIcon, RhombusOutlineIcon} from '../RhombusIcons'
import {menuDivider, variantIcon, versionCount} from './DocumentVariantsMenu.css'
import {getDocumentVariantBundles} from './getDocumentVariantBundles'
import {useSelectedVariant} from './useSelectedVariant'

type IconProps = SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>

function FilledVariantIcon(props: IconProps) {
  return <RhombusIcon size="large" className={variantIcon} {...props} />
}

function OutlineVariantIcon(props: IconProps) {
  return <RhombusOutlineIcon className={variantIcon} {...props} />
}

/** The number of versions, naming their bundles in a tooltip. */
function VersionCount(props: {bundleTitles: string[]}) {
  const {bundleTitles} = props
  const {t} = useTranslation(structureLocaleNamespace)
  const listFormat = useListFormat({type: 'unit', style: 'short'})

  return (
    <Tooltip
      content={
        <Text size={1} as="div">
          {t('document-panel-navigation.variants.versions-tooltip', {
            count: bundleTitles.length,
            bundles: listFormat.format(bundleTitles),
          })}
        </Text>
      }
      placement="top"
      portal
    >
      <Flex alignItems="center" gap={1}>
        <Text muted size={1} className={versionCount} data-testid="variant-version-count">
          {bundleTitles.length}
        </Text>
        <Text muted size={0}>
          <DocumentsIcon />
        </Text>
      </Flex>
    </Tooltip>
  )
}

function VariantMenuItem(props: {
  /** Titles of the bundles the variant has a version in. */
  bundleTitles: string[] | undefined
  isSelected: boolean
  onSelect: (variant: SystemVariant) => void
  variant: SystemVariant
}) {
  const {bundleTitles, isSelected, onSelect, variant} = props
  const handleClick = useCallback(() => onSelect(variant), [onSelect, variant])
  const hasVersions = bundleTitles !== undefined && bundleTitles.length > 0

  return (
    <MenuItem
      data-testid={`document-variant-${variant._id}`}
      icon={hasVersions ? FilledVariantIcon : OutlineVariantIcon}
      iconRight={hasVersions ? <VersionCount bundleTitles={bundleTitles} /> : undefined}
      onClick={handleClick}
      pressed={isSelected}
      selected={isSelected}
      text={getVariantTitle(variant)}
    />
  )
}

/**
 * Picks the variant of the default type the studio is working in. Lists Default, the variants the
 * document has versions in, with a count of those versions, and the other variants. Picking one
 * only changes the global variant selection.
 *
 * @internal
 */
export function DocumentVariantsMenu() {
  const {t} = useTranslation(structureLocaleNamespace)
  const {t: tStudio} = useTranslation()
  const {documentId} = useDocumentPane()
  const {data: variants} = useAllVariants()
  const {versions} = useDocumentVersions({documentId})
  const {data: activeReleases} = useActiveReleases()
  const selectedVariant = useSelectedVariant(DEFAULT_VARIANT_TYPE_KEY)
  const setVariant = useSetVariant()
  const [filterQuery, setFilterQuery] = useState('')

  const typeVariants = useMemo(
    () => variants.filter((variant) => getVariantType(variant) === DEFAULT_VARIANT_TYPE_KEY),
    [variants],
  )
  const {defaultBundles, variantBundles} = useMemo(
    () => getDocumentVariantBundles(versions),
    [versions],
  )
  const documentVariantCount = useMemo(
    () => typeVariants.filter((variant) => variantBundles.has(variant._id)).length,
    [typeVariants, variantBundles],
  )

  const releaseTitles = useMemo(
    () =>
      new Map(
        activeReleases.map((release) => [
          getReleaseIdFromReleaseDocumentId(release._id),
          release.metadata.title || tStudio('release.placeholder-untitled-release'),
        ]),
      ),
    [activeReleases, tStudio],
  )
  const getBundleTitles = useCallback(
    (bundles: string[]) =>
      bundles.map((bundle) => {
        if (bundle === PUBLISHED) return tStudio('release.chip.published')
        if (bundle === LATEST) return tStudio('release.chip.draft')
        if (isAgentBundleName(bundle)) return tStudio('version.agent-bundle.agent-changes')
        return releaseTitles.get(bundle) ?? bundle
      }),
    [releaseTitles, tStudio],
  )
  const defaultBundleTitles = useMemo(
    () => getBundleTitles(defaultBundles),
    [defaultBundles, getBundleTitles],
  )

  const defaultLabel = tStudio('navbar.variant.default')
  const filteredVariants = useMemo(
    () => filterVariantsForSearch(typeVariants, filterQuery, defaultLabel),
    [defaultLabel, filterQuery, typeVariants],
  )
  const showDefault = filteredVariants.some(isDefaultVariant)
  const {documentVariants, otherVariants} = useMemo(() => {
    const inDocument: SystemVariant[] = []
    const others: SystemVariant[] = []
    for (const variant of filteredVariants) {
      if (isDefaultVariant(variant)) continue
      if (variantBundles.has(variant._id)) {
        inDocument.push(variant)
      } else {
        others.push(variant)
      }
    }
    return {documentVariants: inDocument, otherVariants: others}
  }, [filteredVariants, variantBundles])

  const handleSelectDefault = useCallback(() => {
    setVariant({type: DEFAULT_VARIANT_TYPE_KEY, variantId: undefined})
    setFilterQuery('')
  }, [setVariant])

  const handleSelectVariant = useCallback(
    (variant: SystemVariant) => {
      setVariant({type: DEFAULT_VARIANT_TYPE_KEY, variantId: variant._id})
      setFilterQuery('')
    },
    [setVariant],
  )

  if (typeVariants.length === 0) {
    return null
  }

  const isDefaultSelected = !selectedVariant
  const renderVariantItem = (variant: SystemVariant) => {
    const bundles = variantBundles.get(variant._id)
    return (
      <VariantMenuItem
        bundleTitles={bundles ? getBundleTitles(bundles) : undefined}
        isSelected={selectedVariant?._id === variant._id}
        key={variant._id}
        onSelect={handleSelectVariant}
        variant={variant}
      />
    )
  }

  return (
    <>
      <DocumentNavigationMenu
        testId="document-variants-menu"
        button={
          <DropdownButton
            data-testid="document-variants-menu-button"
            icon={RhombusIcon}
            onClear={selectedVariant ? handleSelectDefault : undefined}
            tone="suggest"
            text={
              selectedVariant
                ? getVariantTitle(selectedVariant)
                : t('document-panel-navigation.variants.button.text')
            }
          />
        }
        filterPlaceholder={t('document-panel-navigation.filter-placeholder')}
        filterQuery={filterQuery}
        onFilterChange={setFilterQuery}
        leadingItems={
          showDefault ? (
            <MenuItem
              data-testid="document-variant-default"
              icon={defaultBundleTitles.length > 0 ? FilledVariantIcon : OutlineVariantIcon}
              iconRight={
                defaultBundleTitles.length > 0 ? (
                  <VersionCount bundleTitles={defaultBundleTitles} />
                ) : undefined
              }
              onClick={handleSelectDefault}
              pressed={isDefaultSelected}
              selected={isDefaultSelected}
              text={defaultLabel}
            />
          ) : null
        }
        sections={[
          {
            key: 'document',
            label: t('document-panel-navigation.variants.section.has-variants', {
              count: documentVariantCount,
            }),
            items: documentVariants.map(renderVariantItem),
            alwaysShow: true,
            tooltip:
              documentVariantCount === 0
                ? t('document-panel-navigation.variants.section.no-variants-tooltip')
                : undefined,
          },
          {
            key: 'other',
            label: t('document-panel-navigation.variants.section.other'),
            items: otherVariants.map(renderVariantItem),
          },
        ]}
      />
      <div aria-hidden className={menuDivider} data-testid="document-variants-menu-divider" />
    </>
  )
}
