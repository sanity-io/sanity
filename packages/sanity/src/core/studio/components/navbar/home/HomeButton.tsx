import {Card, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useStateLink} from 'sanity/router'
import {Flex} from 'ui5'

import {focusRingStyle} from '../../../../form/components/withFocusRing/helpers'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher/useActiveWorkspace'
import {WorkspacePreviewIcon} from '../workspace/WorkspacePreview'
import {focusRingBoxShadowVar, homeButtonCard, logoMarkContainer, radiusVar} from './HomeButton.css'

const RADIUS = 2

/**
 * Home button in the main navbar.
 *
 * - Displays the workspace icon only.
 */
export function HomeButton() {
  const {activeWorkspace} = useActiveWorkspace()
  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})
  // Read from the parent context, like the styled wrapper did (not from the card's own tone)
  const {color, input, radius} = useThemeV2()

  return (
    <Card
      as="a"
      className={homeButtonCard}
      href={rootHref}
      onClick={handleRootClick}
      style={assignInlineVars({
        // `rem()` returns `0` for a zero radius; the variable needs the string form
        [radiusVar]: `${rem(radius[RADIUS])}`,
        [focusRingBoxShadowVar]: focusRingStyle({
          base: color,
          focusRing: {...input.text.focusRing, offset: 1},
        }),
      })}
    >
      <Flex alignItems="center">
        <Card className={logoMarkContainer} overflow="hidden" radius={RADIUS}>
          <Flex alignItems="center" height="100%" justifyContent="center">
            <WorkspacePreviewIcon icon={activeWorkspace.icon} size="small" />
          </Flex>
        </Card>
      </Flex>
    </Card>
  )
}
