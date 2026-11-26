import {type PortableTextBlock} from '@sanity/types'

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
        text: 'You have 5 days left in your trial.',
      },
    ],
    markDefs: [],
  },
]

const PRIMARY_ONLY: FreeTrialDialog = {
  _createdAt: '2024-01-01T00:00:00.000Z',
  _id: 'trial-dialog-primary',
  _rev: '1',
  _type: 'dialog',
  _updatedAt: '2024-01-01T00:00:00.000Z',
  ctaButton: {action: 'closeDialog', text: 'Got it'},
  descriptionText: DESCRIPTION,
  dialogType: 'modal',
  headingText: 'Your trial is ending soon',
  id: 'trial-dialog-primary',
  image: null,
}

const WITH_SECONDARY: FreeTrialDialog = {
  ...PRIMARY_ONLY,
  _id: 'trial-dialog-secondary',
  ctaButton: {action: 'openUrl', text: 'Upgrade', url: 'https://www.sanity.io/pricing'},
  headingText: 'Upgrade to keep publishing',
  id: 'trial-dialog-secondary',
  secondaryButton: {text: 'Not now'},
}

const NOOP = () => undefined

export type FreeTrialDialogContentStoryMode = 'primary' | 'secondary'

/**
 * Chromatic sentinel for the free-trial modal after the ui5 Heading / Flex /
 * Box migration. Heading padding sits above serialized description copy and
 * the Dialog footer (primary only vs dual actions). No image (avoids
 * network). Copy is a fixture.
 */
export function FreeTrialDialogContentStory(props: {mode: FreeTrialDialogContentStoryMode}) {
  const content = props.mode === 'secondary' ? WITH_SECONDARY : PRIMARY_ONLY

  return (
    <TestWrapper schemaTypes={[]}>
      <DialogContent
        content={content}
        onClose={NOOP}
        onOpenNext={NOOP}
        onOpenUrlCallback={NOOP}
        open
      />
    </TestWrapper>
  )
}
