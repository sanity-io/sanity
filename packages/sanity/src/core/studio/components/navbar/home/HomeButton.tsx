import {Card, Flex} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {useStateLink} from 'sanity/router'
import {styled} from 'styled-components'

import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {WorkspacePreviewIcon} from '../workspace'

const LOGO_MARK_SIZE = 25 // width and height, px
const RADIUS = 2

const LogoMarkContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: RADIUS,
})`
  height: ${LOGO_MARK_SIZE}px;
  width: ${LOGO_MARK_SIZE}px;
`

const StyledCard = styled(Card)`
  border-radius: ${vars.radius[RADIUS]};
  display: flex;
  outline: none;
  text-decoration: none;
  &:focus-visible {
    /* TODO: fix this */
  }
`

/**
 * Home button in the main navbar.
 *
 * - Displays the workspace icon only.
 */
export function HomeButton() {
  const {activeWorkspace} = useActiveWorkspace()
  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})

  return (
    <StyledCard as="a" href={rootHref} onClick={handleRootClick}>
      <Flex align="center">
        <LogoMarkContainer>
          <Flex align="center" height="fill" justify="center">
            <WorkspacePreviewIcon icon={activeWorkspace.icon} size="small" />
          </Flex>
        </LogoMarkContainer>
      </Flex>
    </StyledCard>
  )
}
