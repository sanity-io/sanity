import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {SearchIcon} from '@sanity/icons/Search'
// oxlint-disable-next-line no-restricted-imports -- the chevron trigger needs the hit-area style only @sanity/ui Button accepts
import {Button, TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ChangeEvent, useCallback, useState} from 'react'
import {styled} from 'styled-components'
import {Box, Flex} from 'ui5'

import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {CreateReleaseDialog} from '../../../../releases/components/dialog/CreateReleaseDialog'
import {useReleasesUpsell} from '../../../../releases/contexts/upsell/useReleasesUpsell'
import {oversizedButtonStyle} from '../../../styles'
import {type ReleasesNavMenuItemPropsGetter} from '../../../types'
import {useStableMenuWidth} from '../../useStableMenuWidth'
import {globalPerspectiveMenu} from '../ReleasesMenu.css'
import {useScrollIndicatorVisibility} from '../useScrollIndicatorVisibility'
import {ReleasesList} from './ReleasesList'

const OversizedButton = styled(Button)`
  ${oversizedButtonStyle}
`

/**
 * The releases menu as it is on `main`: the chevron inside the classic pill, with `main`'s rows.
 * Studios without the variants beta get this, so they look and behave as they did before the beta.
 * The beta's chip and restyled rows live one folder up.
 *
 * @internal
 */
export function ClassicReleasesMenu({
  selectedPerspectiveName,
  areReleasesEnabled = true,
  menuItemProps,
}: {
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element {
  const {t} = useTranslation()
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const {menuRef, menuStyle, lockMenuWidth, resetMenuWidth} = useStableMenuWidth()

  const {isRangeVisible, resetRangeVisibility, setScrollContainer, scrollElementRef} =
    useScrollIndicatorVisibility()
  const handleOpenBundleDialog = useCallback(() => {
    if (releasesUpsellMode === 'upsell') {
      handleOpenReleasesUpsellDialog()
      return
    }
    setCreateBundleDialogOpen(true)
  }, [releasesUpsellMode, handleOpenReleasesUpsellDialog])

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    resetRangeVisibility()
    resetMenuWidth()
    setFilterQuery('')
  }, [resetMenuWidth, resetRangeVisibility])

  return (
    <>
      <MenuButton
        button={
          <OversizedButton
            aria-label={t('release.navbar.open-releases')}
            data-testid="global-perspective-menu-button"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
          />
        }
        id="releases-menu"
        onClose={handleMenuClose}
        onOpen={lockMenuWidth}
        menu={
          <Menu
            className={globalPerspectiveMenu}
            data-testid="release-menu"
            ref={menuRef}
            padding={0}
            style={menuStyle}
          >
            <Box flexShrink={0} padding={2} borderBottom>
              <TextInput
                data-testid="global-perspective-filter"
                fontSize={1}
                icon={SearchIcon}
                onChange={handleFilterChange}
                placeholder={t('release.navbar.filter-placeholder')}
                radius={2}
                value={filterQuery}
              />
            </Box>
            <Flex flexDirection="column" overflowY="auto">
              <ReleasesList
                areReleasesEnabled={areReleasesEnabled}
                filterQuery={filterQuery}
                setScrollContainer={setScrollContainer}
                isRangeVisible={isRangeVisible}
                scrollElementRef={scrollElementRef}
                selectedPerspectiveName={selectedPerspectiveName}
                handleOpenBundleDialog={handleOpenBundleDialog}
                menuItemProps={menuItemProps}
              />
            </Flex>
          </Menu>
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
      {createBundleDialogOpen && (
        <CreateReleaseDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
