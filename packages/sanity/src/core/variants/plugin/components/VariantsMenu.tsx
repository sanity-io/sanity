import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
// oxlint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Box, Button, Menu, MenuDivider, Text, TextInput} from '@sanity/ui'
import {useCallback, useMemo, useState} from 'react'
import {useRouter} from 'sanity/router'
import {styled} from 'styled-components'

import {MenuButton, MenuItem} from '../../../../ui-components'
import {useTranslation} from '../../../i18n'
import {oversizedButtonStyle} from '../../../perspective/styles'
import {useSetVariant} from '../../../perspective/useSetVariant'
import {variantsLocaleNamespace} from '../../i18n'
import {useAllVariants} from '../../store/useAllVariants'
import {
  decodeVariantIdFromRoute,
  filterVariantsForSearch,
  getVariantId,
  getVariantTitle,
} from '../../tool/util'
import {type SystemVariant} from '../../types'
import {RhombusIcon} from './PersonalizationIcons'

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

const OversizedButton = styled(Button)`
  ${oversizedButtonStyle}
`

/**
 * @internal
 */
export function VariantsMenu(): React.JSX.Element {
  const {t} = useTranslation(variantsLocaleNamespace)
  const router = useRouter()
  const setVariant = useSetVariant()
  const {data: variants} = useAllVariants()
  const [filterQuery, setFilterQuery] = useState('')

  const selectedVariantDocumentId = decodeVariantIdFromRoute(
    router.stickyParams.variant ?? undefined,
  )
  const selectedVariant = useMemo(
    () =>
      selectedVariantDocumentId
        ? variants.find((variant) => variant._id === selectedVariantDocumentId)
        : undefined,
    [selectedVariantDocumentId, variants],
  )

  const filteredVariants = useMemo(
    () => filterVariantsForSearch(variants, filterQuery),
    [filterQuery, variants],
  )

  const handleSelectDefault = useCallback(() => {
    setVariant(undefined)
    setFilterQuery('')
  }, [setVariant])

  const handleSelectVariant = useCallback(
    (variant: SystemVariant) => {
      setVariant(variant)
      setFilterQuery('')
    },
    [setVariant],
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
      button={
        <OversizedButton
          data-testid="variants-nav-menu-button"
          iconRight={ChevronDownIcon}
          mode="bleed"
          padding={2}
          radius="full"
        />
      }
      id="variants-nav-menu"
      onClose={handleMenuClose}
      menu={
        <StyledMenu data-testid="variants-nav-menu" padding={0}>
          <Box padding={2}>
            <TextInput
              fontSize={1}
              onChange={handleFilterChange}
              placeholder={t('navbar.variant.filter-placeholder')}
              radius={2}
              value={filterQuery}
            />
          </Box>

          <MenuDivider />

          <MenuItem
            data-testid="variant-default"
            icon={RhombusIcon}
            onClick={handleSelectDefault}
            pressed={isDefaultSelected}
            selected={isDefaultSelected}
            text={t('navbar.variant.default')}
          />

          {filteredVariants.length > 0 && (
            <>
              <Box padding={3} paddingBottom={2}>
                <SectionHeader muted size={0} weight="medium">
                  {t('navbar.variant.other')}
                </SectionHeader>
              </Box>

              {filteredVariants.map((variant) => {
                const isSelected = selectedVariant?._id === variant._id

                return (
                  <MenuItem
                    key={variant._id}
                    data-testid={`variant-${getVariantId(variant._id)}`}
                    icon={RhombusIcon}
                    onClick={() => handleSelectVariant(variant)}
                    pressed={isSelected}
                    selected={isSelected}
                    text={getVariantTitle(variant)}
                  />
                )
              })}
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
