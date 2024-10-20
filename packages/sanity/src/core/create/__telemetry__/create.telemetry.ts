import {defineEvent} from '@sanity/telemetry'

export const StartInCreateClicked = defineEvent({
  name: 'Start in Create clicked',
  version: 1,
  description: 'The "Start in Sanity Create" button is clicked.',
})

export const StartInCreateAccepted = defineEvent({
  name: 'Start in Create accepted',
  version: 1,
  description:
    'Continue in the "Start in Sanity Create" dialog was pressed, or auto-confirm was enabled.',
})

export const CreateUnlinkClicked = defineEvent({
  name: 'Create Unlink clicked',
  version: 1,
  description: 'The Unlink action was clicked',
})

export const CreateUnlinkAccepted = defineEvent({
  name: 'Create Unlink accepted',
  version: 1,
  description: 'User confirmed that they want the Studio document unlinked',
})

export const EditInCreateClicked = defineEvent({
  name: 'Edit in Create clicked',
  version: 1,
  description: 'User clicked "Edit in Create"',
})
