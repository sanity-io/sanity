import {AddIcon} from '@sanity/icons/Add'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type RefAttributes, type SVGProps, useCallback, useMemo, useState, type JSX} from 'react'
import {useIntentLink} from 'sanity/router'
import {Text, Flex, Box} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {RhombusIconLarge} from '../../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getConditionMismatchMessage} from '../../../variants/components/ConditionMismatchIndicator'
import {CreateVariantDialog} from '../../../variants/components/dialog/CreateVariantDialog'
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
import {useStableMenuWidth} from '../useStableMenuWidth'
import {variantsMenu} from './VariantsMenu.css'
import {suggestIconColor} from './VariantsNav.css'

const VariantMenuItemIcon = (props: SVGProps<SVGSVGElement> & RefAttributes<SVGSVGElement>) => {
  return <RhombusIconLarge className={suggestIconColor} {...props} />
}

function VariantMenuItem(props: {
  isSelected: boolean
  onSelect: (variant: SystemVariant) => void
  variant: SystemVariant
}) {
  const {isSelected, onSelect, variant} = props
  const {t} = useTranslation()
  const mismatches = useVariantConditionMismatches(variant.conditions, getVariantType(variant))
  const mismatchMessage =
    mismatches.length > 0 ? getConditionMismatchMessage(t, mismatches) : undefined

  return (
    <MenuItem
      data-testid={`variant-${getVariantId(variant._id)}`}
      icon={VariantMenuItemIcon}
      iconRight={
        mismatches.length > 0 ? (
          <span data-testid="variant-condition-mismatch">
            <ToneIcon icon={ErrorOutlineIcon} tone="critical" />
          </span>
        ) : undefined
      }
      onClick={() => onSelect(variant)}
      pressed={isSelected}
      selected={isSelected}
      text={getVariantTitle(variant)}
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
            <Box flexShrink={0} paddingX={3} paddingTop={3} paddingBottom={2}>
              <TextInput
                fontSize={1}
                icon={SearchIcon}
                onChange={handleFilterChange}
                placeholder={t('navbar.variant.filter-placeholder')}
                radius={2}
                value={filterQuery}
              />
            </Box>
            {filteredVariants.length === 0 ? (
              <FilterNoMatches filter={filterQuery.trim()} />
            ) : (
              <Flex
                flexDirection="column"
                flexGrow={1}
                flexShrink={1}
                minHeight="0"
                overflowY="auto"
                paddingX={3}
                paddingBottom={2}
              >
                {/* Menu items are flex children with min-height: 0, so they collapse
                when they sit directly in this scroller. Keep them in a column
                that sizes to its content. */}
                <Flex flexDirection="column" flexShrink={0} gap={1}>
                  {filteredVariants.map((variant) =>
                    isDefaultVariant(variant) ? (
                      <MenuItem
                        data-testid="variant-default"
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
              paddingX={3}
              paddingTop={2}
              paddingBottom={3}
              hidden={filterQuery.trim().length > 0}
            >
              <MenuItem
                as="a"
                data-testid="view-all"
                href={viewAllHref}
                icon={RhombusIconLarge}
                onClick={handleViewAll}
                text={t('navbar.variant.menu.view-all')}
              />
              {allowCreate && (
                <MenuItem
                  data-testid="new-audience"
                  onClick={handleNewAudience}
                  icon={AddIcon}
                  text={t('navbar.variant.menu.new-audience')}
                />
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
