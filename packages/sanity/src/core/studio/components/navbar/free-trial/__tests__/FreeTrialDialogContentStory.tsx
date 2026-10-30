import {type PortableTextBlock} from '@sanity/types'
import noop from 'lodash-es/noop.js'

import {TestWrapper} from '../../../../../../../test/browser/TestWrapper'
import {DialogContent} from '../DialogContent'
import {type FreeTrialDialog} from '../types'

const DESCRIPTION: PortableTextBlock[] = [
  {
    _type: 'block',
    _key: 'body',
    style: 'normal',
    children: [
      {
        _type: 'span',
        _key: 'body-span',
        marks: [],
        text: 'Your trial has ended. Upgrade to keep publishing from this project.',
      },
    ],
    markDefs: [],
  },
]

export const TRIAL_ENDED_DIALOG: FreeTrialDialog = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'trial-ended',
  _rev: '1',
  _type: 'dialog',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {action: 'openUrl', text: 'See plans', url: 'https://www.sanity.io/pricing'},
  descriptionText: DESCRIPTION,
  dialogType: 'modal',
  headingText: 'Your trial has ended',
  id: 'trial-ended',
  image: null,
  secondaryButton: {text: 'Maybe later'},
}

/**
 * Harness for the free-trial modal. No image (its only network read) and a
 * two-button footer, so the floating close button, the heading and the
 * serialized description all render from fixture copy.
 */
export function FreeTrialDialogContentStory() {
  return (
    <TestWrapper schemaTypes={[]}>
      <DialogContent
        content={TRIAL_ENDED_DIALOG}
        onClose={noop}
        onOpenNext={noop}
        onOpenUrlCallback={noop}
        open
      />
    </TestWrapper>
  )
}
