import {DocumentsIcon} from '@sanity/icons/Documents'
import {InfoOutlineIcon} from '@sanity/icons/InfoOutline'
import {Label, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {
  type ChangeEvent,
  type ReactNode,
  type RefAttributes,
  type SVGProps,
  useCallback,
  useId,
  useMemo,
  useState,
} from 'react'
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
import {Box, Flex, Text} from 'ui5'

import {MenuButton} from '../../../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../../../ui-components/menuItem/MenuItem'
import {Tooltip} from '../../../../../../../ui-components/tooltip/Tooltip'
import {structureLocaleNamespace} from '../../../../../../i18n'
import {useDocumentPane} from '../../../../useDocumentPane'
import {DropdownButton} from '../DropdownButton'
import {RhombusIcon, RhombusOutlineIcon} from '../RhombusIcons'
import {
  documentVariantsMenu,
  menuDivider,
  variantIcon,
  versionCount,
} from './DocumentVariantsMenu.css'
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
        <Text size={1} as="div" trim={true}>
          {t('document-panel-navigation.variants.versions-tooltip', {
            count: bundleTitles.length,
            bundles: listFormat.format(bundleTitles),
          })}
        </Text>
      }
      placement="top"
      portal
    >
      <span className={versionCount} data-testid="variant-version-count">
        {bundleTitles.length}
        <DocumentsIcon />
      </span>
    </Tooltip>
  )
}

function MenuSection(props: {
  children?: ReactNode
  label: string
  testId: string
  /** Explains the section, behind an info icon beside the label. */
  tooltip?: string
}) {
  const {children, label, testId, tooltip} = props
  return (
    <Flex borderTop data-testid={testId} flexDirection="column" gap={1} paddingTop={1}>
      <Flex alignItems="center" gap={2} paddingX={3} paddingTop={3} paddingBottom={2}>
        <Label muted size={1} style={{textTransform: 'uppercase'}}>
          {label}
        </Label>
        {tooltip ? (
          <Tooltip
            content={
              <Text size={1} as="div" trim={true}>
                {tooltip}
              </Text>
            }
            placement="top"
            portal
          >
            <span aria-label={tooltip} data-testid={`${testId}-tooltip`} role="img">
              <Text muted size={1}>
                <InfoOutlineIcon />
              </Text>
            </span>
          </Tooltip>
        ) : null}
      </Flex>
      {children}
    </Flex>
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
  const menuId = useId()
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

  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    setFilterQuery('')
  }, [])

  if (typeVariants.length === 0) {
    return null
  }

  const isFiltering = filterQuery.trim().length > 0
  const hasMatches = filteredVariants.length > 0
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
      <MenuButton
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
        id={menuId}
        onClose={handleMenuClose}
        menu={
          <Menu className={documentVariantsMenu} data-testid="document-variants-menu" padding={1}>
            <Box flexShrink={0} padding={1}>
              <TextInput
                fontSize={1}
                onChange={handleFilterChange}
                placeholder={t('document-panel-navigation.variants.filter-placeholder')}
                radius={2}
                value={filterQuery}
              />
            </Box>
            {hasMatches ? (
              <Flex
                flexDirection="column"
                flexGrow={1}
                flexShrink={1}
                minHeight="0"
                overflowY="auto"
                paddingX={1}
                paddingBottom={1}
              >
                {/* Menu items are flex children with min-height: 0, so they collapse when they sit
              directly in this scroller. Keep them in a column that sizes to its content. */}
                <Flex flexDirection="column" flexShrink={0} gap={1}>
                  {showDefault ? (
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
                  ) : null}
                  {!isFiltering || documentVariants.length > 0 ? (
                    <MenuSection
                      label={t('document-panel-navigation.variants.section.has-variants', {
                        count: documentVariantCount,
                      })}
                      testId="document-variants-menu-section-document"
                      tooltip={
                        documentVariantCount === 0
                          ? t('document-panel-navigation.variants.section.no-variants-tooltip')
                          : undefined
                      }
                    >
                      {documentVariants.map(renderVariantItem)}
                    </MenuSection>
                  ) : null}
                  {otherVariants.length > 0 ? (
                    <MenuSection
                      label={tStudio('navbar.variant.other')}
                      testId="document-variants-menu-section-other"
                    >
                      {otherVariants.map(renderVariantItem)}
                    </MenuSection>
                  ) : null}
                </Flex>
              </Flex>
            ) : (
              <Box data-testid="document-variants-menu-no-matches" paddingX={4} paddingBottom={3}>
                <Text muted size={1}>
                  {tStudio('navbar.filter.no-matches', {filter: filterQuery.trim()})}
                </Text>
              </Box>
            )}
          </Menu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          overflow: 'hidden',
          placement: 'bottom-start',
          portal: true,
          tone: 'default',
          zOffset: 3000,
        }}
      />
      <div aria-hidden className={menuDivider} data-testid="document-variants-menu-divider" />
    </>
  )
}
