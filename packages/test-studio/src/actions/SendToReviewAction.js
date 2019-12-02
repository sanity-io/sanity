import * as React from 'react'
import {mutate} from '../mockDocStateDatastore'

const REVIEWERS = ['simen', 'even', 'marius', 'per-kristian']

function setIfMissing(id, path, value) {
  return {
    patch: {
      id,
      setIfMissing: {
        [path]: value
      }
    }
  }
}
function append(id, path, items) {
  return {
    patch: {
      id,
      insert: {
        after: `${path}[-1]`,
        items: items
      }
    }
  }
}
function unset(id, paths) {
  return {
    patch: {
      id: id,
      unset: paths
    }
  }
}

function addReviewer(id, reviewerName) {
  const draftId = `drafts.${id}`
  return mutate(id, [
    setIfMissing(draftId, 'reviewers', []),
    unset(draftId, [`reviewers[_key=="${reviewerName}"]`]),
    append(draftId, `reviewers`, [{_key: reviewerName, name: reviewerName}])
  ])
}

function removeReviewer(id, reviewerName) {
  const draftId = `drafts.${id}`
  return mutate(id, [unset(draftId, [`reviewers[_key=="${reviewerName}"]`])])
}

function SendToReviewAction(record) {
  const [isOpen, setOpen] = React.useState(false)

  if (!record.draft) {
    return null
  }

  const reviewers = record.draft.reviewers || []

  return {
    label: reviewers.length > 0 ? `Awaiting review from ${reviewers.length}` : 'Request review',
    handle: () => {
      setOpen(true)
    },
    dialog: isOpen && {
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
          <button onClick={() => setOpen(false)}>OK</button>
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
