import {Card} from '@sanity/ui'
import {type ComponentType} from 'react'
import {styled} from 'styled-components'

import {usePerspective} from '../../perspective/usePerspective'
import {useReleasesToolAvailable} from '../../schedules/hooks/useReleasesToolAvailable'
import {useWorkspace} from '../../studio/workspace'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {type ReleasesNavMenuItemPropsGetter} from '../types'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'
import {usePerspectiveMenuExtension} from './PerspectiveMenuExtension'
import {SingleStateControl} from './SingleStateControl'

const ReleasesNavContainer = styled(Card)`
  position: relative;
  display: flex;
  &:not([hidden]) {
    display: flex;
  }
  align-items: center;
  gap: 2px;
  padding: 2px;
  margin: -3px 0;

  /* The children in button is rendered inside a span, we need to absolutely position the dot for the error. */
  span:has(> [data-ui='error-status-icon']) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }

  a:hover,
  button:hover {
    position: relative;
    z-index: 2;
  }
`

interface Props {
  withReleasesToolButton?: boolean
  menuItemProps?: ReleasesNavMenuItemPropsGetter
  border?: boolean
}

/**
 * @internal
 */
export const ReleasesNav: ComponentType<Props> = ({
  withReleasesToolButton,
  menuItemProps,
  border = true,
}) => {
  const releasesToolAvailable = useReleasesToolAvailable()
  const isReleasesEnabled = !!useWorkspace().releases?.enabled
  const {selectedPerspective, selectedPerspectiveName} = usePerspective()
  // PROPOSED: a host may add a suffix after the label.
  const extension = usePerspectiveMenuExtension()
  // PROPOSED: a host's section holds the state control and its own controls in one base (no border; the state control is a white chip inside it).
  const section = extension?.section
  const state = (
    <>
      {extension?.onLabelClick ? (
        // PROPOSED: the label and suffix become one control (the host toggles something with it).
        // The capture phase keeps a release label's own link from navigating.
        <div
          aria-expanded={extension.labelExpanded}
          data-testid="perspective-label-toggle"
          onClickCapture={(event) => {
            event.preventDefault()
            event.stopPropagation()
            extension.onLabelClick?.()
          }}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return
            event.preventDefault()
            extension.onLabelClick?.()
          }}
          role="button"
          style={{alignItems: 'center', cursor: 'pointer', display: 'flex'}}
          tabIndex={0}
          title={extension.labelTitle}
        >
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
          {extension.labelSuffix}
        </div>
      ) : (
        <>
          <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
          {extension?.labelSuffix}
        </>
      )}
      <GlobalPerspectiveMenu
        selectedPerspectiveName={selectedPerspectiveName}
        areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
        menuItemProps={menuItemProps}
      />
    </>
  )
  return (
    <ReleasesNavContainer
      flex="none"
      tone="inherit"
      radius="full"
      data-ui="ReleasesNav"
      border={section ? false : border}
      data-section={section ? '' : undefined}
      style={section?.style}
    >
      {!section && withReleasesToolButton && releasesToolAvailable && <ReleasesToolLink />}
      {section ? (
        <>
          {section.leading}
          <div
            data-testid="perspective-section-state"
            style={{
              alignItems: 'center',
              background: 'var(--card-bg-color)',
              borderRadius: 9999,
              display: 'flex',
            }}
          >
            {section.singleControl ? (
              // PROPOSED: one button, the trigger of the menu (no link to the Releases tool inside it).
              <GlobalPerspectiveMenu
                areReleasesEnabled={releasesToolAvailable && isReleasesEnabled}
                menuItemProps={menuItemProps}
                selectedPerspectiveName={selectedPerspectiveName}
                trigger={<SingleStateControl selectedPerspective={selectedPerspective} />}
              />
            ) : (
              <>
                {withReleasesToolButton && releasesToolAvailable && <ReleasesToolLink />}
                {state}
              </>
            )}
          </div>
          {section.trailing}
        </>
      ) : (
        state
      )}
    </ReleasesNavContainer>
  )
}
