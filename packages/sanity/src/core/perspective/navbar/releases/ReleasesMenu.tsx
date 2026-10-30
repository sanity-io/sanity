import {SearchIcon} from '@sanity/icons/Search'
import {TextInput} from '@sanity/ui'
import {Menu} from '@sanity/ui/menu'
import {type ChangeEvent, useCallback, useRef, useState} from 'react'
import {Flex} from 'ui5'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {CreateReleaseDialog} from '../../../releases/components/dialog/CreateReleaseDialog'
import {ReleaseAvatarIcon} from '../../../releases/components/ReleaseAvatar'
import {useReleasesUpsell} from '../../../releases/contexts/upsell/useReleasesUpsell'
import {type ReleasesNavMenuItemPropsGetter} from '../../types'
import {useGetDefaultPerspective} from '../../useGetDefaultPerspective'
import {useSetPerspective} from '../../useSetPerspective'
import {GlobalPerspectiveButton} from '../GlobalPerspectiveButton'
import {ReleasesList} from './ReleasesList'
import {globalPerspectiveMenu, releasesMenuItemIcon} from './ReleasesMenu.css'
import {useReleasesLabel} from './useReleasesLabel'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

export function ReleasesMenu({
  selectedPerspectiveName,
  areReleasesEnabled = true,
  menuItemProps,
}: {
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element {
  const {t} = useTranslation()
  const setPerspective = useSetPerspective()
  const defaultPerspective = useGetDefaultPerspective()
  const {displayTitle, fullTitle, selectedPerspective} = useReleasesLabel()
  // Drafts disabled coerces the default name to `published`, so a truthy name
  // is not enough to tell a selection from the default perspective.
  const canClearPerspective = selectedPerspective !== defaultPerspective
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const [filterQuery, setFilterQuery] = useState('')
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const menuRef = useRef<HTMLDivElement>(null)

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

  const handleClearPerspective = useCallback(() => {
    setPerspective(undefined)
  }, [setPerspective])

  const handleFilterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setFilterQuery(event.currentTarget.value)
  }, [])

  const handleMenuClose = useCallback(() => {
    resetRangeVisibility()
    setFilterQuery('')
  }, [resetRangeVisibility])

  return (
    <>
      <MenuButton
        button={
          <GlobalPerspectiveButton
            data-testid="global-perspective-menu-button"
            fullText={fullTitle}
            handleClearPerspective={canClearPerspective ? handleClearPerspective : undefined}
            icon={
              <ReleaseAvatarIcon
                release={selectedPerspective}
                size="small"
                className={releasesMenuItemIcon}
              />
            }
            text={displayTitle}
          />
        }
        id="releases-menu"
        onClose={handleMenuClose}
        menu={
          <Menu
            className={globalPerspectiveMenu}
            data-testid="release-menu"
            ref={menuRef}
            padding={0}
          >
            <Flex flexDirection="column" flexShrink={0} padding={2} borderBottom>
              <TextInput
                data-testid="global-perspective-filter"
                fontSize={1}
                icon={SearchIcon}
                onChange={handleFilterChange}
                placeholder={t('release.navbar.filter-placeholder')}
                radius={2}
                value={filterQuery}
              />
            </Flex>
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
