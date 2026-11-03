import {LaunchIcon} from '@sanity/icons/Launch'
// oxlint-disable-next-line no-restricted-imports -- the studio Button types its ref for a <button>, and this is an <a>
import {Button} from '@sanity/ui'
import {type KeyboardEvent, type RefAttributes} from 'react'
import {useIntentLink} from 'sanity/router'
import {Box} from 'ui5'

import {Tooltip} from '../../../../ui-components/tooltip/Tooltip'
import {useTranslation} from '../../../i18n/hooks/useTranslation'
import {RELEASES_INTENT} from '../../../releases/plugin'
import {type ReleaseId} from '../../types'
import {releaseDetailLink, releaseDetailLinkContainer} from './ReleaseDetailLink.css'

/**
 * Opens a release's detail page from the global perspective menu.
 *
 * Rendered next to the release's menu item rather than inside it: the menu item is a `<button>`,
 * and interactive content inside a button is invalid HTML that assistive technology never
 * exposes. The link is not a menu item either, so the arrow keys keep moving between menu items
 * only; `ReleasesMenuItem` moves focus to it with the right arrow key.
 */
export function ReleaseDetailLink(
  props: {
    releaseId: ReleaseId
    title: string
    onKeyDown: (event: KeyboardEvent<HTMLAnchorElement>) => void
    onMouseEnter: () => void
    onMouseLeave: () => void
    onNavigate?: () => void
  } & RefAttributes<HTMLAnchorElement>,
) {
  const {ref, releaseId, title, onKeyDown, onMouseEnter, onMouseLeave, onNavigate} = props
  const {t} = useTranslation()
  const {href, onClick} = useIntentLink({
    intent: RELEASES_INTENT,
    params: {id: releaseId},
    onClick: onNavigate,
  })

  return (
    <Box className={releaseDetailLinkContainer} padding={1}>
      <Tooltip portal content={t('release.action.view-release')} placement="bottom">
        <Button
          aria-label={t('release.navbar.view-release-aria-label', {title})}
          as="a"
          className={releaseDetailLink}
          data-testid={`release-detail-link-${releaseId}`}
          href={href}
          icon={LaunchIcon}
          mode="ghost"
          onClick={onClick}
          onKeyDown={onKeyDown}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          fontSize={1}
          padding={2}
          ref={ref}
          // Menu items leave the tab order to the menu; the right arrow key reaches the link
          tabIndex={-1}
        />
      </Tooltip>
    </Box>
  )
}
