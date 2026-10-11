import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider} from '@sanity/ui/menu'
import {useCallback, useMemo, useState, type JSX} from 'react'
import {styled} from 'styled-components'
import {Flex, Box} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../ui-components/menuItem/MenuItem'
import {ToneIcon} from '../../../../ui-components/toneIcon/ToneIcon'
import {RhombusIcon} from '../../../components/temporary-icons/Rhombus'
import {RhombusOutlinedIcon} from '../../../components/temporary-icons/RhombusOutlined'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {usePerspective} from '../../../perspective/usePerspective'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {getConditionMismatchMessage} from '../../components/ConditionMismatchIndicator'
import {useVariantConditionMismatches} from '../../hooks/useVariantConditions'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {filterVariantsForSearch, getVariantId, getVariantTitle} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {DEFAULT_VARIANT_TYPE_KEY, getVariantType} from '../../util/variantType'
import {menuIconSpacer, suggestIconColor} from './VariantsNav.css'

const StyledMenu = styled(Menu)`
  min-width: 240px;
  max-width: 320px;

  > [data-ui='Stack'] {
    gap: 0;
  }
`

const SectionHeader = styled(Text)`
  text-transform: uppercase;
  letter-spacing: 0.04em;
`

function VariantMenuItem(props: {
  isSelected: boolean
  onSelect: (variant: SystemVariant) => void
  variant: SystemVariant
}) {
  const {isSelected, onSelect, variant} = props
  const {t} = useTranslation(variantsLocaleNamespace)
  const mismatches = useVariantConditionMismatches(variant.conditions, getVariantType(variant))
  const mismatchMessage =
    mismatches.length > 0 ? getConditionMismatchMessage(t, mismatches) : undefined

  return (
    <MenuItem
      data-testid={`variant-${getVariantId(variant._id)}`}
      icon={
        <Text size={2} className={suggestIconColor}>
          <RhombusIcon />
        </Text>
      }
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
                <Text muted size={1}>
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
  trigger,
  typeKey = DEFAULT_VARIANT_TYPE_KEY,
}: {
  trigger: JSX.Element
  typeKey?: string
}): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const setVariant = useSetVariant()
  const {data: variants} = useAllVariants()
  const [filterQuery, setFilterQuery] = useState('')
  const {selectedVariants} = usePerspective()
  const typeVariants = useMemo(
    () => variants.filter((variant) => getVariantType(variant) === typeKey),
    [typeKey, variants],
  )
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
          <Box padding={2}>
            <TextInput
              fontSize={1}
              onChange={handleFilterChange}
              placeholder={t('navbar.variant.filter-placeholder')}
              radius={2}
              value={filterQuery}
            />
          </Box>

          <Box paddingX={2} paddingY={1}>
            <MenuItem
              data-testid="variant-default"
              icon={
                <Text size={2} className={suggestIconColor}>
                  <RhombusOutlinedIcon />
                </Text>
              }
              onClick={handleSelectDefault}
              pressed={isDefaultSelected}
              selected={isDefaultSelected}
              text={t('navbar.variant.default')}
            />
          </Box>
          <MenuDivider />

          {filteredVariants.length > 0 && (
            <>
              <Box paddingX={2}>
                <Flex paddingTop={3} paddingBottom={2} gap={2} paddingLeft={3}>
                  {/* Spacer for icon alignment */}
                  <Box className={menuIconSpacer} />
                  <Box>
                    <SectionHeader muted size={0} weight="medium">
                      {t('navbar.variant.other')}
                    </SectionHeader>
                  </Box>
                </Flex>
              </Box>
              <Box paddingX={2}>
                {filteredVariants.map((variant) => (
                  <VariantMenuItem
                    key={variant._id}
                    isSelected={selectedVariant?._id === variant._id}
                    onSelect={handleSelectVariant}
                    variant={variant}
                  />
                ))}
              </Box>
            </>
          )}
        </StyledMenu>
      }
      popover={{
        __unstable_margins: [0, 0, 32, 0],
        constrainSize: true,
        fallbackPlacements: ['bottom-end'],
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
