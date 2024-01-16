import {Box, Card, Flex, Text, rem} from '@sanity/ui'
import styled, {css} from 'styled-components'
import {focusRingStyle} from '../../../../form/components/withFocusRing/helpers'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {useWorkspaces} from '../../../workspaces'
import {SanityLogo} from '../SanityLogo'
import {WorkspacePreviewIcon} from '../workspace'
import {useStateLink} from 'sanity/router'

const LOGO_MARK_SIZE = 25 // width and height, px
const RADIUS = 2

const LogoMarkContainer = styled(Card).attrs({
  overflow: 'hidden',
  radius: RADIUS,
})`
  height: ${LOGO_MARK_SIZE}px;
  width: ${LOGO_MARK_SIZE}px;
`

const StyledCard = styled(Card)(({theme}) => {
  const {focusRing} = theme.sanity
  const {base} = theme.sanity.color
  return css`
    border-radius: ${rem(theme.sanity.radius[RADIUS])};
    display: flex;
    outline: none;
    text-decoration: none;
    &:focus-visible {
      box-shadow: ${focusRingStyle({base, focusRing: {...focusRing, offset: 1}})};
    }
  `
})

/**
 * Home button in the main navbar.
 *
 * If only one workspace is available:
 * - Displays the workspace icon (if defined), otherwise falls back to the Sanity logo.
 * - Displays the active workspace title.
 *
 * If multiple workspaces are available:
 * - Displays the workspace icon only.
 */
export function HomeButton() {
  const workspaces = useWorkspaces()
  const {activeWorkspace} = useActiveWorkspace()
  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})

  const multipleWorkspaces = workspaces.length > 1

  return (
    <StyledCard __unstable_focusRing as="a" href={rootHref} onClick={handleRootClick}>
      <Flex align="center">
        <LogoMarkContainer>
          <Flex align="center" height="fill" justify="center">
            {multipleWorkspaces || activeWorkspace.customIcon ? (
              <WorkspacePreviewIcon icon={activeWorkspace.icon} size="small" />
            ) : (
              <SanityLogo />
            )}
          </Flex>
        </LogoMarkContainer>
        {!multipleWorkspaces && (
          <Box paddingX={2}>
            <Text size={1} weight="medium">
              {activeWorkspace.title}
            </Text>
          </Box>
        )}
      </Flex>
    </StyledCard>
  )
}
