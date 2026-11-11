import {DocumentsIcon} from '@sanity/icons/Documents'
import {Text} from '@sanity/ui'
import {type RefAttributes, type SVGProps, useCallback, useMemo, useState} from 'react'
import {
  DEFAULT_VARIANT_TYPE_KEY,
  filterVariantsForSearch,
  getPublishedId,
  getReleaseIdFromReleaseDocumentId,
  getVariantTitle,
  getVariantType,
  getVersionFromId,
  getVersionId,
  isAgentBundleName,
  isDefaultVariant,
  LATEST,
  PUBLISHED,
  type SystemVariant,
  useActiveReleases,
  useAgentVersionDisplay,
  useAllVariants,
  useDocumentVersions,
  useListFormat,
  usePerspective,
  useTranslation,
  type VersionInfoDocumentStub,
} from 'sanity'
import {Flex} from 'ui5'

import {MenuItem} from '../../../../../../../ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../../../../ui-components/tooltip/Tooltip'
import {usePerspectiveNavigator} from '../../../../../../hooks/usePerspectiveNavigator'
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
 * Version ids for the agent bundles on this document, one per bundle name, in version order.
 * Variant versions have opaque ids, so each id is the one that bundle would have outside a
 * variant. `useAgentVersionDisplay` reads the bundle name from it.
 */
function agentBundleVersionIds(versions: VersionInfoDocumentStub[], groupId: string): string[] {
  const seen = new Set<string>()
  const versionIds: string[] = []
  for (const version of versions) {
    const bundleId = version._system.bundleId
    if (!bundleId || !isAgentBundleName(bundleId) || seen.has(bundleId)) continue
    seen.add(bundleId)
    versionIds.push(getVersionId(groupId, bundleId))
  }
  return versionIds
}

/** Drops every agent bundle except the one `useAgentVersionDisplay` kept. */
function withoutOtherAgentBundles(
  bundles: string[],
  visibleAgentBundleId: string | undefined,
): string[] {
  return bundles.filter((bundle) => !isAgentBundleName(bundle) || bundle === visibleAgentBundleId)
}

/**
 * Picks the variant of the default type the studio is working in. Lists Default, the variants the
 * document has versions in, with a count of those versions, and the other variants. Picking one
 * changes the global variant selection, and closes the scheduled draft open in this pane.
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
  const {selectedPerspectiveName} = usePerspective()
  const selectedVariant = useSelectedVariant(DEFAULT_VARIANT_TYPE_KEY)
  const {setVariant} = usePerspectiveNavigator()
  const [filterQuery, setFilterQuery] = useState('')
  const groupId = getPublishedId(documentId)

  const typeVariants = useMemo(
    () => variants.filter((variant) => getVariantType(variant) === DEFAULT_VARIANT_TYPE_KEY),
    [variants],
  )
  const {defaultBundles, variantBundles} = useMemo(
    () => getDocumentVariantBundles(versions),
    [versions],
  )
  const agentVersionIds = useMemo(
    () => agentBundleVersionIds(versions, groupId),
    [groupId, versions],
  )
  const {filteredVersionIds, getVersionDisplay} = useAgentVersionDisplay(
    agentVersionIds,
    selectedPerspectiveName,
  )
  const visibleAgentBundleId = filteredVersionIds[0]
    ? getVersionFromId(filteredVersionIds[0])
    : undefined
  const visibleDefaultBundles = useMemo(
    () => withoutOtherAgentBundles(defaultBundles, visibleAgentBundleId),
    [defaultBundles, visibleAgentBundleId],
  )
  const visibleVariantBundles = useMemo(() => {
    const visible = new Map<string, string[]>()
    for (const [variantId, bundles] of variantBundles) {
      const kept = withoutOtherAgentBundles(bundles, visibleAgentBundleId)
      if (kept.length > 0) visible.set(variantId, kept)
    }
    return visible
  }, [variantBundles, visibleAgentBundleId])
  const documentVariantCount = useMemo(
    () => typeVariants.filter((variant) => visibleVariantBundles.has(variant._id)).length,
    [typeVariants, visibleVariantBundles],
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
        if (isAgentBundleName(bundle)) {
          return (
            getVersionDisplay(getVersionId(groupId, bundle))?.displayName ??
            tStudio('version.agent-bundle.proposed-changes')
          )
        }
        return releaseTitles.get(bundle) ?? bundle
      }),
    [getVersionDisplay, groupId, releaseTitles, tStudio],
  )
  const defaultBundleTitles = useMemo(
    () => getBundleTitles(visibleDefaultBundles),
    [getBundleTitles, visibleDefaultBundles],
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
      if (visibleVariantBundles.has(variant._id)) {
        inDocument.push(variant)
      } else {
        others.push(variant)
      }
    }
    return {documentVariants: inDocument, otherVariants: others}
  }, [filteredVariants, visibleVariantBundles])

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
    const bundles = visibleVariantBundles.get(variant._id)
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
