import * as React from 'react'
import {mutate, publish} from '../../mockDocStateDatastore'
import {setIfMissing, set, unset, append} from './patch-helpers'

function addReviewer(id, reviewerId) {
  return mutate(id, [
    setIfMissing('reviewers', []),
    unset([`reviewers[_key=="${reviewerId}"]`]),
    append(`reviewers`, [{_key: reviewerId, userId: reviewerId}]),
  ])
}

function removeReviewer(id, reviewerId) {
  return mutate(id, [unset([`reviewers[_key=="${reviewerId}"]`])])
}

function approve(id, reviewerId) {
  return mutate(id, [set(`approvedBy`, reviewerId)])
}

export default function PolicyBasedReview(docInfo) {
  const currentUser = useCurrentUser()
  const [isSelectReviewersDialogOpen, setSelectReviewersDialogOpen] = React.useState(false)
  const [isReviewAndApproveDialogOpen, setReviewAndApprove] = React.useState(false)

  if (docInfo.isLiveEdit || !docInfo.draft) {
    return null
  }

  const approvedBy = docInfo.draft.approvedBy
  const currentReviewers = docInfo.draft.reviewers || []
  if (approvedBy) {
    return {
      label: 'Publish',
      handle: () => {
        publish(docInfo.id)
      },
    }
  } else if (
    currentUser &&
    currentReviewers.length > 0 &&
    currentReviewers.some((r) => r.userId === currentUser.id)
  ) {
    return {
      label: 'Review & approve',
      handle: () => {
        setReviewAndApprove(true)
      },
      dialog: isReviewAndApproveDialogOpen && (
        <>
          <h2>What do you think?</h2>

          <button type="button" onClick={() => approve(docInfo.id, currentUser.id)}>
            Looks good to me!
          </button>
        </>
      ),
    }
  }

  return {
    label: currentReviewers.length > 0 ? `Awaiting approval` : 'Request approval',
    handle: () => {
      setSelectReviewersDialogOpen(true)
    },
    dialog: isSelectReviewersDialogOpen && (
      <>
        <h2>Select who should approve</h2>
        <SelectReviewer
          reviewers={currentReviewers}
          onAdd={(reviewerId) => addReviewer(docInfo.id, reviewerId)}
          onRemove={(reviewerId) => removeReviewer(docInfo.id, reviewerId)}
        />
        <button type="button" onClick={() => setSelectReviewersDialogOpen(false)}>
          OK
        </button>
      </>
    ),
  }
}

function ShowUser(props) {
  const user = useUser(props.id)
  return <span>{user && user.displayName}</span>
}

function SelectReviewer(props) {
  const policyDocument = useDocument('mock-policy-document')

  if (!policyDocument) {
    return <div>Loading policies…</div>
  }
  return (
    <div>
      {policyDocument.permissions.map((perm) => {
        const canReview = canApprove(perm)
        return (
          <label key={perm._key} style={{display: 'block'}}>
            <input
              type="checkbox"
              disabled={!canReview}
              checked={props.reviewers.some((r) => r._key === perm.userId)}
              onClick={(event) => {
                const op = event.currentTarget.checked ? props.onAdd : props.onRemove
                op(perm.userId)
              }}
            />{' '}
            <ShowUser id={perm.userId} /> {!canReview && "(can't approve)"}
          </label>
        )
      })}
    </div>
  )
}

function canApprove(permission) {
  return ['approve', 'publish'].includes(permission.access)
}
