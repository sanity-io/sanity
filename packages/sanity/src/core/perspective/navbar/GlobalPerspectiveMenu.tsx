import {ChevronDownIcon} from '@sanity/icons'
// eslint-disable-next-line no-restricted-imports -- Button requires props, only supported by @sanity/ui
import {Button, Menu} from '@sanity/ui'
import {useCallback, useRef, useState} from 'react'
import {styled} from 'styled-components'

import {MenuButton} from '../../../ui-components'
import {CreateReleaseDialog} from '../../releases/components/dialog/CreateReleaseDialog'
import {oversizedButtonStyle} from '../styles'
import {type ReleaseId} from '../types'
import {ReleasesList} from './ReleasesList'
import {useScrollIndicatorVisibility} from './useScrollIndicatorVisibility'

const StyledMenu = styled(Menu)`
  min-width: 200px;
  max-width: 320px;
`
const OversizedButton = styled(Button)`
  ${oversizedButtonStyle}
`

export function GlobalPerspectiveMenu({
  selectedReleaseId,
  areReleasesEnabled = true,
}: {
  selectedReleaseId: ReleaseId | undefined
  areReleasesEnabled: boolean
}): React.JSX.Element {
  const [createBundleDialogOpen, setCreateBundleDialogOpen] = useState(false)
  const styledMenuRef = useRef<HTMLDivElement>(null)

  const {isRangeVisible, onScroll, resetRangeVisibility, setScrollContainer, scrollElementRef} =
    useScrollIndicatorVisibility()

  const handleClose = useCallback(() => {
    setCreateBundleDialogOpen(false)
  }, [])

  return (
    <>
      <MenuButton
        button={
          <OversizedButton
            data-testid="global-perspective-menu-button"
            iconRight={ChevronDownIcon}
            mode="bleed"
            padding={2}
            radius="full"
          />
        }
        id="releases-menu"
        onClose={resetRangeVisibility}
        menu={
          <StyledMenu data-testid="release-menu" ref={styledMenuRef}>
            <ReleasesList
              areReleasesEnabled={areReleasesEnabled}
              setScrollContainer={setScrollContainer}
              onScroll={onScroll}
              isRangeVisible={isRangeVisible}
              scrollElementRef={scrollElementRef}
              selectedReleaseId={selectedReleaseId}
              setCreateBundleDialogOpen={setCreateBundleDialogOpen}
            />
          </StyledMenu>
        }
        popover={{
          constrainSize: true,
          fallbackPlacements: ['bottom-end'],
          placement: 'bottom-end',
          portal: true,
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
