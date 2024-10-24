import {defineEvent} from '@sanity/telemetry'

export const CreateDocumentLinkCtaClicked = defineEvent({
  name: 'Create Document Link CTA Clicked',
  version: 1,
  description: 'The "Start in Sanity Create" button is clicked.',
})

export const CreateDocumentLinkAccepted = defineEvent({
  name: 'Create Document Link Accepted',
  version: 1,
  description:
    'Continue in the "Start in Sanity Create" dialog was pressed, or auto-confirm was enabled.',
})

export const CreateDocumentUnlinkCtaClicked = defineEvent({
  name: 'Create Document Unlink CTA Clicked',
  version: 1,
  description: 'The Unlink action was clicked',
})

export const CreateDocumentUnlinkApproved = defineEvent({
  name: 'Create Document Unlink Approved',
  version: 1,
  description: 'User confirmed that they want the Studio document unlinked',
})

export const CreateDocumentOpened = defineEvent({
  name: 'Create Document Opened',
  version: 1,
  description: 'User clicked "Edit in Create"',
})
