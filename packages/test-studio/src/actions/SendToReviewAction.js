import * as React from 'react'
import {mutate} from '../mockDocStateDatastore'
import {setIfMissing, unset, append} from './patch-helpers'

const REVIEWERS = ['simen', 'even', 'marius', 'per-kristian']

function addReviewer(id, reviewerName) {
  return mutate(id, [
    setIfMissing('reviewers', []),
    unset([`reviewers[_key=="${reviewerName}"]`]),
    append(`reviewers`, [{_key: reviewerName, name: reviewerName}])
  ])
}

function removeReviewer(id, reviewerName) {
  return mutate(id, [unset([`reviewers[_key=="${reviewerName}"]`])])
}

function SendToReviewAction(record) {
  const [isDialogOpen, setDialogOpen] = React.useState(false)

  if (!record.draft || record.isLiveEdit) {
    return null
  }

  const reviewers = record.draft.reviewers || []

  return {
    label: reviewers.length > 0 ? `Awaiting review from ${reviewers.length}` : 'Request review',
    handle: () => {
      setDialogOpen(true)
    },
    dialog: isDialogOpen && {
      type: 'popover',
      children: (
        <>
          Select who should review
          {REVIEWERS.map(reviewer => {
            return (
              <label key={reviewer} style={{display: 'block'}}>
                <input
                  type="checkbox"
                  checked={reviewers.some(r => r._key === reviewer)}
                  onClick={event => {
                    const op = event.currentTarget.checked ? addReviewer : removeReviewer
                    op(record.id, reviewer)
                  }}
                />{' '}
                {reviewer}
              </label>
            )
          })}
          <button onClick={() => setDialogOpen(false)}>OK</button>
        </>
      )
    }
  }
}

export default {
  id: 'send-to-review',
  group: 'primary',
  action: SendToReviewAction
}
