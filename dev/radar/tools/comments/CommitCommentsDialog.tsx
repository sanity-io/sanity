import {Box, Dialog} from '@sanity/ui'

import {type ChartScope, CommitCommentsPanel} from './CommitCommentsPanel'

/**
 * The comment threads on a commit that no run in the chart measured — a merge
 * commented from the Bisect stepper, typically. Its marker sits at the
 * commit's own date, so there is no run dialog to open; this is the same
 * comments panel on its own, so the bubble still leads to the threads instead
 * of being the one marker that does nothing.
 */
export function CommitCommentsDialog(props: {
  sha: string
  scope?: ChartScope
  onClose: () => void
}) {
  const {sha, scope, onClose} = props
  return (
    <Dialog
      id={`commit-comments-${sha}`}
      header={`Comments on commit ${sha.slice(0, 7)}`}
      width={1}
      onClose={onClose}
      onClickOutside={onClose}
    >
      <Box padding={4}>
        <CommitCommentsPanel sha={sha} title={`Commit ${sha.slice(0, 7)}`} scope={scope} />
      </Box>
    </Dialog>
  )
}
