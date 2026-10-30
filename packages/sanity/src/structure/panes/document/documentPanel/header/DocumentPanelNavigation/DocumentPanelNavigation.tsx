import {useWorkspace} from 'sanity'
import {Flex} from 'ui5'

import {AgentChangesBadge} from './badges/AgentChangesBadge'
import {DraftBadge} from './badges/DraftBadge'
import {PublishedBadge} from './badges/PublishedBadge'
import {ReleaseBadge} from './badges/ReleaseBadge'
import {useNavigationBadges} from './badges/useNavigationBadges'
import {DocumentVariantsMenu} from './variants/DocumentVariantsMenu'

/**
 * The navigation on the left of the document header, shown when variants or the document group
 * inventory are enabled: the variants menu, then a badge per bundle the selected variant of the
 * document has a version in.
 *
 * @internal
 */
export function DocumentPanelNavigation() {
  const {beta} = useWorkspace()
  const {agent, draft, navigate, published, releases} = useNavigationBadges()

  return (
    <Flex alignItems="center" flexShrink={0} gap={1}>
      {beta?.variants?.enabled ? <DocumentVariantsMenu /> : null}
      {/* The releases menu (`./releases`) goes here. */}
      <PublishedBadge navigate={navigate} state={published} />
      {draft ? <DraftBadge navigate={navigate} state={draft} /> : null}
      {releases.map(({release, selected}) => (
        <ReleaseBadge key={release._id} navigate={navigate} release={release} selected={selected} />
      ))}
      {agent ? <AgentChangesBadge agent={agent} navigate={navigate} /> : null}
    </Flex>
  )
}
