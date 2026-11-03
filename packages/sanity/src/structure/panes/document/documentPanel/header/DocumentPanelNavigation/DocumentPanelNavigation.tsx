import {useWorkspace} from 'sanity'
import {Flex} from 'ui5'

import {AgentChangesBadge} from './badges/AgentChangesBadge'
import {DraftBadge} from './badges/DraftBadge'
import {PublishedBadge} from './badges/PublishedBadge'
import {useNavigationBadges} from './badges/useNavigationBadges'
import {DocumentReleasesMenu} from './releases/DocumentReleasesMenu'
import {DocumentVariantsMenu} from './variants/DocumentVariantsMenu'

/**
 * The navigation on the left of the document header, shown when variants or the document group
 * inventory are enabled: the variants menu, the Published and Draft badges of the selected
 * variant, the releases menu, and the current user's agent bundle.
 *
 * @internal
 */
export function DocumentPanelNavigation() {
  const {beta} = useWorkspace()
  const {agent, draft, navigate, published} = useNavigationBadges()

  return (
    <Flex alignItems="center" flexShrink={0} gap={1}>
      {beta?.variants?.enabled ? <DocumentVariantsMenu /> : null}
      <PublishedBadge navigate={navigate} state={published} />
      {draft ? <DraftBadge navigate={navigate} state={draft} /> : null}
      <DocumentReleasesMenu />
      {agent ? <AgentChangesBadge agent={agent} navigate={navigate} /> : null}
    </Flex>
  )
}
