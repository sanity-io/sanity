import {Card, Flex, rem, useTheme_v2 as useThemeV2} from '@sanity/ui'
import {assignInlineVars} from '@vanilla-extract/dynamic'
import {useStateLink} from 'sanity/router'

import {focusRingStyle} from '../../../../form/components/withFocusRing/helpers'
import {useActiveWorkspace} from '../../../activeWorkspaceMatcher'
import {WorkspacePreviewIcon} from '../workspace'
import {logoMarkContainer, styledCard, radiusVar, focusRingShadowVar} from './HomeButton.css'

const RADIUS = 2

/**
 * Home button in the main navbar.
 *
 * - Displays the workspace icon only.
 */
export function HomeButton() {
  const {activeWorkspace} = useActiveWorkspace()
  const {href: rootHref, onClick: handleRootClick} = useStateLink({state: {}})
  const {card, color, radius} = useThemeV2()
  const radiusValue = String(rem(radius[RADIUS]))
  const focusRingValue = focusRingStyle({
    base: color,
    focusRing: {...card.focusRing, offset: 1},
  })

  return (
    <Card
      className={styledCard}
      as="a"
      href={rootHref}
      onClick={handleRootClick}
      style={assignInlineVars({
        [radiusVar]: radiusValue,
        [focusRingShadowVar]: focusRingValue,
      })}
    >
      <Flex align="center">
        <Card className={logoMarkContainer} radius={RADIUS}>
          <Flex align="center" height="fill" justify="center">
            <WorkspacePreviewIcon icon={activeWorkspace.icon} size="small" />
          </Flex>
        </Card>
      </Flex>
    </Card>
  )
}
