import * as React from 'react'
import {mutate} from '../../mockDocStateDatastore'
import {setIfMissing, unset, append} from './patch-helpers'

const REVIEWERS = ['simen', 'even', 'marius', 'per-kristian']

function addReviewer(id, reviewerName) {
  return mutate(id, [
    setIfMissing('reviewers', []),
    unset([`reviewers[_key=="${reviewerName}"]`]),
    append(`reviewers`, [{_key: reviewerName, name: reviewerName}]),
  ])
}

function removeReviewer(id, reviewerName) {
  return mutate(id, [unset([`reviewers[_key=="${reviewerName}"]`])])
}

export default function SendToReviewAction(docInfo) {
  const [isDialogOpen, setDialogOpen] = React.useState(false)

  if (!docInfo.draft || docInfo.isLiveEdit) {
    return null
  }

  const reviewers = docInfo.draft.reviewers || []

  return {
    label: reviewers.length > 0 ? `Awaiting review from ${reviewers.length}` : 'Request review',
    onHandle: () => {
      setDialogOpen(true)
    },
    dialog: isDialogOpen && (
      <>
        Select who should review
        {REVIEWERS.map((reviewer) => {
          return (
            <label key={reviewer} style={{display: 'block'}}>
              <input
                type="checkbox"
                checked={reviewers.some((r) => r._key === reviewer)}
                onClick={(event) => {
                  const op = event.currentTarget.checked ? addReviewer : removeReviewer
                  op(docInfo.id, reviewer)
                }}
              />{' '}
              {reviewer}
            </label>
          )
        })}
        <button onClick={() => setDialogOpen(false)}>OK</button>
      </>
    ),
  }
}
