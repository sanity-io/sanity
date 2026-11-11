import {AddIcon} from '@sanity/icons/Add'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {clsx} from 'clsx'
import {
  type RefAttributes,
  type SVGProps,
  Suspense,
  use,
  useCallback,
  useMemo,
  useState,
  type JSX,
} from 'react'
import {VariantsModePromiseContext} from 'sanity/_singletons'
import {useIntentLink} from 'sanity/router'
import {Text, Flex, Box} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {menuOverflowScroller} from '../../../../ui-components/menuButton/menuOverflow.css'
import {useFocusSearchOnOpen} from '../../../../ui-components/menuButton/useFocusSearchOnOpen'
import {useMenuOverflow} from '../../../../ui-components/menuButton/useMenuOverflow'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {VariantMark} from '../../../../ui-components/variantMark'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getConditionMismatchMessage} from '../../../variants/components/ConditionMismatchIndicator'
import {CreateVariantDialog} from '../../../variants/components/dialog/CreateVariantDialog'
import {useVariantsUpsell} from '../../../variants/contexts/upsell/useVariantsUpsell'
import {useVariantConditionMismatches} from '../../../variants/hooks/useVariantConditions'
import {VARIANTS_INTENT} from '../../../variants/plugin'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {
  filterVariantsForSearch,
  getVariantId,
  getVariantTitle,
  isDefaultVariant,
} from '../../../variants/tool/util'
import {isVariantId, type SystemVariant} from '../../../variants/types'
import {DEFAULT_VARIANT_TYPE_KEY, getVariantType} from '../../../variants/util/variantType'
import {usePerspective} from '../../usePerspective'
import {useSetVariant} from '../../useSetVariant'
import {FilterNoMatches} from '../FilterNoMatches'
import {
  PerspectiveDetailLink,
  renderWithDetailLinkSpace,
  usePerspectiveDetailLink,
  usePerspectiveDetailLinkTrigger,
} from '../PerspectiveDetailLink'
import {useStableMenuWidth} from '../useStableMenuWidth'
import {conditionMismatchIcon, variantMenuItemRow, variantsMenu} from './VariantsMenu.css'

/** Where the variant diamond's 21px box starts, from the row's left edge. */
const VARIANT_MARK_BOX_INSET = 6

/**
 * Passed to the menu item as a component, not as an element in a wrapper, so the menu item's
 * `Icon` sizes and colours the svg itself: a wrapper took the colour (grey) in its place and,
 * holding the svg inline, added a line box under it that lifted the icon off the row's centre.
 */
const ConditionMismatchMenuIcon = (
  props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>,
) => {
  return (
    <ErrorOutlineIcon
      {...props}
      className={clsx(props.className, conditionMismatchIcon)}
      data-testid="variant-condition-mismatch"
    />
  )
}

function VariantMenuItem(props: {
  isSelected: boolean
  onNavigate: () => void
  onSelect: (variant: SystemVariant) => void
  variant: SystemVariant
}) {
  const {isSelected, onNavigate, onSelect, variant} = props
  const {t} = useTranslation()
  const mismatches = useVariantConditionMismatches(variant.conditions, getVariantType(variant))
  const mismatchMessage =
    mismatches.length > 0 ? getConditionMismatchMessage(t, mismatches) : undefined
  const {menuItemProps: detailLinkMenuItemProps, linkProps: detailLinkProps} =
    usePerspectiveDetailLink({selected: isSelected})
  const variantId = getVariantId(variant._id)
  const title = getVariantTitle(variant)

  return (
    <div className={variantMenuItemRow} data-detail-link-row="">
      <MenuItem
        {...detailLinkMenuItemProps}
        data-testid={`variant-${variantId}`}
        icon={<VariantMark size="row" />}
        iconRight={mismatches.length > 0 ? ConditionMismatchMenuIcon : undefined}
        onClick={() => onSelect(variant)}
        pressed={isSelected}
        renderMenuItem={renderWithDetailLinkSpace}
        selected={isSelected}
        text={title}
        tooltipProps={
          mismatchMessage
            ? {
                content: (
                  <Text muted size={1} as="div" trim={true}>
                    {mismatchMessage}
                  </Text>
                ),
              }
            : undefined
        }
      />
      <PerspectiveDetailLink
        {...detailLinkProps}
        aria-label={t('navbar.variant.menu.view-variant-aria-label', {title})}
        data-testid={`variant-detail-link-${variantId}`}
        intent={VARIANTS_INTENT}
        onNavigate={onNavigate}
        params={{id: variantId}}
        // The link's box sits as far from the row's right edge as the diamond's box does from its
        // left edge (6px: the diamond bleeds that far into the menu item's 12px padding), and
        // the menu item's 12px gap then separates it from a mismatch icon
        style={{paddingRight: VARIANT_MARK_BOX_INSET}}
        tooltip={t('navbar.variant.menu.view-variant')}
      />
    </div>
  )
}

/**
 * Opens the create variant dialog, or the upsell dialog when the plan lacks content variants.
 * Hidden when the feature check failed, so nothing creates a variant the plan may not include.
 */
function NewVariantMenuItem({onCreate}: {onCreate: () => void}) {
  const {t} = useTranslation()
  const {handleOpenDialog} = useVariantsUpsell()
  const modePromise = use(VariantsModePromiseContext)
  // The navbar renders outside the variants plugin; without its provider there is no check to read
  const mode = modePromise ? use(modePromise) : 'default'

  if (mode === null) return null

  return (
    <MenuItem
      data-testid="new-audience"
      onClick={mode === 'upsell' ? () => handleOpenDialog('navbar') : onCreate}
      icon={AddIcon}
      text={t('navbar.variant.menu.new-audience')}
    />
  )
}

/**
 * @internal
 */
export function VariantsMenu({
  allowCreate = true,
  trigger,
  typeKey = DEFAULT_VARIANT_TYPE_KEY,
}: {
  /** Shows the "New audience" item, which opens the create variant dialog. */
  allowCreate?: boolean
  trigger: JSX.Element
  typeKey?: string
}): React.JSX.Element {
  const {t} = useTranslation()
  const setVariant = useSetVariant()
  const {data: variants} = useAllVariants()
  const [filterQuery, setFilterQuery] = useState('')
  const {menuRef, menuStyle, lockMenuWidth, resetMenuWidth} = useStableMenuWidth()
  const focusSearchField = useFocusSearchOnOpen()
  const scrollerRef = useMenuOverflow()
  const {selectedVariants} = usePerspective()
  const typeVariants = useMemo(
    () => variants.filter((variant) => getVariantType(variant) === typeKey),
    [typeKey, variants],
  )
  const [creatingVariant, setCreatingVariant] = useState(false)
  const selectedVariant = useMemo(
    () =>
      typeVariants.find((variant) =>
        selectedVariants.some((selected) => selected?._id === variant._id),
      ),
    [selectedVariants, typeVariants],
  )

  const defaultVariantTitle = t('document-group.base-variant')
  const filteredVariants = useMemo(
    () => filterVariantsForSearch(typeVariants, filterQuery, defaultVariantTitle),
    [defaultVariantTitle, filterQuery, typeVariants],
  )

  const handleSelectDefault = useCallback(() => {
    setVariant({type: typeKey, variantId: undefined})
    setFilterQuery('')
  }, [setVariant, typeKey])

  const handleSelectVariant = useCallback(
    (variant: SystemVariant) => {
      setVariant({type: typeKey, variantId: variant._id})
      setFilterQuery('')
    },
    [setVariant, typeKey],
  )

  const handleFilterChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    resetMenuWidth()
    setFilterQuery('')
  }, [resetMenuWidth])

  const {triggerRef, handleNavigate: handleNavigateToVariant} = usePerspectiveDetailLinkTrigger()

  const isDefaultSelected = !selectedVariant

  const {href: viewAllHref, onClick: handleViewAll} = useIntentLink({
    intent: VARIANTS_INTENT,
  })

  const handleNewAudience = useCallback(() => {
    setCreatingVariant(true)
  }, [])

  const handleCancelCreate = useCallback(() => {
    setCreatingVariant(false)
  }, [])

  const handleCreated = useCallback(
    (createdVariantId: string, createdType: string) => {
      setCreatingVariant(false)

      if (isVariantId(createdVariantId)) {
        setVariant({type: createdType, variantId: createdVariantId})
      }
    },
    [setVariant],
  )

  return (
    <>
      <MenuButton
        button={trigger}
        id={`variants-nav-menu-${typeKey}`}
        onClose={handleMenuClose}
        onOpen={lockMenuWidth}
        ref={triggerRef}
        menu={
          <Menu
            className={variantsMenu}
            data-testid={
              typeKey === DEFAULT_VARIANT_TYPE_KEY
                ? 'variants-nav-menu'
                : `variants-nav-menu-${typeKey}`
            }
            padding={0}
            ref={menuRef}
            style={menuStyle}
          >
            <Box flexShrink={0} padding={2}>
              <TextInput
                fontSize={1}
                icon={SearchIcon}
                onChange={handleFilterChange}
                placeholder={t('navbar.variant.filter-placeholder')}
                radius={2}
                ref={focusSearchField}
                value={filterQuery}
              />
            </Box>
            {filteredVariants.length === 0 ? (
              <FilterNoMatches filter={filterQuery.trim()} />
            ) : (
              <Flex
                className={menuOverflowScroller}
                flexDirection="column"
                flexGrow={1}
                flexShrink={1}
                minHeight="0"
                overflowY="auto"
                ref={scrollerRef}
              >
                {/* Menu items are flex children with min-height: 0, so they collapse
                when they sit directly in this scroller. Keep them in a column
                that sizes to its content. */}
                <Flex flexDirection="column" flexShrink={0} gap={1} padding={1}>
                  {filteredVariants.map((variant) =>
                    isDefaultVariant(variant) ? (
                      <MenuItem
                        data-testid="variant-default"
                        // The same diamond as every other variant row and the navbar chip
                        icon={<VariantMark size="row" />}
                        key={variant._id}
                        onClick={handleSelectDefault}
                        pressed={isDefaultSelected}
                        selected={isDefaultSelected}
                        text={variant.title}
                      />
                    ) : (
                      <VariantMenuItem
                        key={variant._id}
                        isSelected={selectedVariant?._id === variant._id}
                        onNavigate={handleNavigateToVariant}
                        onSelect={handleSelectVariant}
                        variant={variant}
                      />
                    ),
                  )}
                </Flex>
              </Flex>
            )}
            <Flex
              flexDirection="column"
              flexShrink={0}
              gap={1}
              borderTop
              padding={1}
              hidden={filterQuery.trim().length > 0}
            >
              <MenuItem
                as="a"
                data-testid="view-all"
                href={viewAllHref}
                icon={<VariantMark size="row" />}
                onClick={handleViewAll}
                text={t('navbar.variant.menu.view-all')}
              />
              {allowCreate && (
                <Suspense fallback={null}>
                  <NewVariantMenuItem onCreate={handleNewAudience} />
                </Suspense>
              )}
            </Flex>
          </Menu>
        }
        popover={{
          __unstable_margins: [0, 0, 32, 0],
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          overflow: 'hidden',
          placement: 'bottom-end',
          portal: true,
          // @ts-expect-error PopoverProps doesn't include `style`, but the Popover implementation accepts it via React.HTMLProps<HTMLDivElement>
          style: {overflow: 'hidden'} as React.CSSProperties,
          tone: 'default',
          zOffset: 3000,
        }}
      />
      {creatingVariant ? (
        <CreateVariantDialog
          onCancel={handleCancelCreate}
          onSubmit={handleCreated}
          type={typeKey}
        />
      ) : null}
    </>
  )
}
