import {Menu} from '@sanity/ui/menu'
import {useCallback, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components/menuButton/MenuButton'
import {CreateReleaseDialog} from '../../releases/components/dialog/CreateReleaseDialog'
import {ReleaseAvatarIcon} from '../../releases/components/ReleaseAvatar'
import {useReleasesUpsell} from '../../releases/contexts/upsell/useReleasesUpsell'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {useSetPerspective} from '../useSetPerspective'
import {GlobalPerspectiveButton} from './GlobalPerspectiveButton'
import {globalPerspectiveMenuItemIcon} from './GlobalPerspectiveMenuItem.css'
import {ReleasesList} from './ReleasesList'
import {useGlobalPerspectiveLabel} from './useGlobalPerspectiveLabel'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
  /* Remove the default menu gap*/
  > [data-ui='Stack'] {
    gap: 0;
  }
`

export function GlobalPerspectiveMenu({
  selectedPerspectiveName,
  areReleasesEnabled = true,
  menuItemProps,
}: {
  selectedPerspectiveName: string | undefined
  areReleasesEnabled: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
}): React.JSX.Element {
  const setPerspective = useSetPerspective()
  const {displayTitle, fullTitle, selectedPerspective} = useGlobalPerspectiveLabel()
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const {handleOpenDialog: handleOpenReleasesUpsellDialog, mode: releasesUpsellMode} =
    useReleasesUpsell()
  const styledMenuRef = useRef<HTMLDivElement>(null)

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

  return (
    <>
      <MenuButton
        button={
          <GlobalPerspectiveButton
            data-testid="global-perspective-menu-button"
            fullText={fullTitle}
            handleClearPerspective={selectedPerspectiveName ? handleClearPerspective : undefined}
            icon={
              <ReleaseAvatarIcon
                release={selectedPerspective}
                size="small"
                className={globalPerspectiveMenuItemIcon}
              />
            }
            text={displayTitle}
          />
        }
        id="releases-menu"
        onClose={resetRangeVisibility}
        menu={
          <StyledMenu data-testid="release-menu" ref={styledMenuRef} padding={0}>
            <ReleasesList
              areReleasesEnabled={areReleasesEnabled}
              setScrollContainer={setScrollContainer}
              isRangeVisible={isRangeVisible}
              scrollElementRef={scrollElementRef}
              selectedPerspectiveName={selectedPerspectiveName}
              handleOpenBundleDialog={handleOpenBundleDialog}
              menuItemProps={menuItemProps}
            />
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
      {createBundleDialogOpen && (
        <CreateReleaseDialog onCancel={handleClose} onSubmit={handleClose} origin="structure" />
      )}
    </>
  )
}
