import {AddIcon} from '@sanity/icons/Add'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type RefAttributes, type SVGProps, useCallback, useMemo, useState, type JSX} from 'react'
import {useIntentLink} from 'sanity/router'
import {styled} from 'styled-components'
import {Text, Flex} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {RhombusIconLarge} from '../../../components/temporary-icons/Rhombus'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {getConditionMismatchMessage} from '../../../variants/components/ConditionMismatchIndicator'
import {useVariantConditionMismatches} from '../../../variants/hooks/useVariantConditions'
import {VARIANTS_INTENT} from '../../../variants/plugin'
import {useAllVariants} from '../../../variants/store/useAllVariants'
import {filterVariantsForSearch, getVariantId, getVariantTitle} from '../../../variants/tool/util'
import {type SystemVariant} from '../../../variants/types'
import {DEFAULT_VARIANT_TYPE_KEY, getVariantType} from '../../../variants/util/variantType'
import {usePerspective} from '../../usePerspective'
import {useSetVariant} from '../../useSetVariant'
import {suggestIconColor} from './VariantsNav.css'

const StyledMenu = styled(Menu)`
  min-width: 240px;
  max-width: 320px;

  /* The menu's own rule is overflow: auto, which scrolls the whole popover.
     Cap this column to the popover height and let the list section scroll. */
  && {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    max-height: 100%;
    overflow: hidden;
  }

  && > [data-ui='Stack'] {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    gap: 0;
    overflow: hidden;
  }
`
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

const TEMPORARY_VARIANTS_OVERVIEW_INTENT_PARAMS = {source: 'menu'}
/**
 * @internal
 */
export function VariantsMenu({
  trigger,
  typeKey = DEFAULT_VARIANT_TYPE_KEY,
}: {
  trigger: JSX.Element
  typeKey?: string
}): React.JSX.Element {
  const {t} = useTranslation()
  const setVariant = useSetVariant()
  const {data: variants} = useAllVariants()
  const [filterQuery, setFilterQuery] = useState('')
  const {selectedVariants} = usePerspective()
  const typeVariants = useMemo(
    () => variants.filter((variant) => getVariantType(variant) === typeKey),
    [typeKey, variants],
  )
  const [_creatingVariant, setCreatingVariant] = useState(false)
  const selectedVariant = useMemo(
    () =>
      typeVariants.find((variant) =>
        selectedVariants.some((selected) => selected?._id === variant._id),
      ),
    [selectedVariants, typeVariants],
  )

  const filteredVariants = useMemo(
    () => filterVariantsForSearch(typeVariants, filterQuery),
    [filterQuery, typeVariants],
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
    setFilterQuery('')
  }, [])

  const isDefaultSelected = !selectedVariant

  const {href: viewAllHref, onClick: handleViewAll} = useIntentLink({
    intent: VARIANTS_INTENT,
    params: TEMPORARY_VARIANTS_OVERVIEW_INTENT_PARAMS,
  })

  const handleNewAudience = useCallback(() => {
    setCreatingVariant(true)
  }, [])

  return (
    <MenuButton
      button={trigger}
      id={`variants-nav-menu-${typeKey}`}
      onClose={handleMenuClose}
      menu={
        <StyledMenu
          data-testid={
            typeKey === DEFAULT_VARIANT_TYPE_KEY
              ? 'variants-nav-menu'
              : `variants-nav-menu-${typeKey}`
          }
          padding={0}
        >
          <Flex flexDirection="column" flexShrink={0} paddingX={3} paddingTop={3} paddingBottom={2}>
            <TextInput
              fontSize={1}
              icon={SearchIcon}
              onChange={handleFilterChange}
              placeholder={t('navbar.variant.filter-placeholder')}
              radius={2}
              value={filterQuery}
            />
          </Flex>
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
              <MenuItem
                data-testid="variant-default"
                onClick={handleSelectDefault}
                pressed={isDefaultSelected}
                selected={isDefaultSelected}
                text={t('document-group.base-variant')}
              />
              {filteredVariants.map((variant) => (
                <VariantMenuItem
                  key={variant._id}
                  isSelected={selectedVariant?._id === variant._id}
                  onSelect={handleSelectVariant}
                  variant={variant}
                />
              ))}
            </Flex>
          </Flex>
          <Flex
            flexDirection="column"
            flexShrink={0}
            gap={1}
            borderTop
            paddingX={3}
            paddingTop={2}
            paddingBottom={3}
          >
            <MenuItem
              as="a"
              data-testid="view-all"
              href={viewAllHref}
              icon={RhombusIconLarge}
              onClick={handleViewAll}
              text={t('navbar.variant.menu.view-all')}
            />
            <MenuItem
              data-testid="new-audience"
              onClick={handleNewAudience}
              icon={AddIcon}
              text={t('navbar.variant.menu.new-audience')}
              tooltipProps={{
                content: 'This action is not yet implemented.',
              }}
              // TODO: temporary disabled until we add the create variants form here.
              disabled
            />
          </Flex>
        </StyledMenu>
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
  )
}
