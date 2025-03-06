import {Card, Flex} from '@sanity/ui'
import {styled} from 'styled-components'

import {usePerspective} from '../../perspective/usePerspective'
import {useWorkspace} from '../../studio'
import {ReleasesToolLink} from '../ReleasesToolLink'
import {CurrentGlobalPerspectiveLabel} from './currentGlobalPerspectiveLabel'
import {GlobalPerspectiveMenu} from './GlobalPerspectiveMenu'

const ReleasesNavContainer = styled(Card)`
  position: relative;
  --p-bg-color: var(--card-bg-color);
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border: 1px solid var(--card-border-color);
    border-radius: 9999px;
    pointer-events: none;
    z-index: 3;
  }

  // The children in button is rendered inside a span, we need to absolutely position the dot for the error.
  span:has(> [data-ui='error-status-icon']) {
    position: absolute;
    top: 6px;
    right: 6px;
    padding: 0;
  }

  .p-menu-btn {
    margin: -1px;
    box-shadow: inset 0 0 0 4px var(--p-bg-color) !important;
  }

  button.p-menu-btn:hover,
  a.p-menu-btn:hover {
    position: relative;
    z-index: 2;
  }

  .p-menu-btn + .p-menu-btn {
    margin-left: -6px;
  }
  .p-menu-btn + .p-menu-btn.small {
    margin: -1px;
    margin-left: -3px;
  }
`
export function ReleasesNav(): React.JSX.Element {
  const areReleasesEnabled = !!useWorkspace().releases?.enabled

  const {selectedPerspective, selectedReleaseId} = usePerspective()

  return (
    <ReleasesNavContainer flex="none" tone="inherit" radius="full" data-ui="ReleasesNav">
      <Flex>
        {areReleasesEnabled && <ReleasesToolLink />}

        <CurrentGlobalPerspectiveLabel selectedPerspective={selectedPerspective} />
        <GlobalPerspectiveMenu
          selectedReleaseId={selectedReleaseId}
          areReleasesEnabled={areReleasesEnabled}
        />
      </Flex>
    </ReleasesNavContainer>
  )
}
