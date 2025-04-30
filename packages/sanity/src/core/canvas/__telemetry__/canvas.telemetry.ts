import {defineEvent} from '@sanity/telemetry'

export const CanvasLinkCtaClicked = defineEvent({
  name: 'Canvas Link CTA Clicked',
  version: 1,
  description: 'The "Link to Canvas" button is clicked.',
})

export type CanvasLinkRedirectOrigin = 'diff-dialog' | 'redirect'
export const CanvasLinkRedirected = defineEvent<{origin: CanvasLinkRedirectOrigin}>({
  name: 'Canvas Link Redirect',
  version: 1,
  description: 'The user is redirected to the canvas studio-import page',
})

export const CanvasLinkDialogDiffsShown = defineEvent({
  name: 'Canvas Link Dialog Diffs Shown',
  version: 1,
  description: 'The diffs dialog is shown',
})

export const CanvasLinkDialogRejected = defineEvent({
  name: 'Canvas Link Dialog Rejected',
  version: 1,
  description: 'The user rejects the diffs shown in the dialog',
})

export const CanvasUnlinkCtaClicked = defineEvent({
  name: 'Canvas Unlink CTA Clicked',
  version: 1,
  description: 'The Unlink action was clicked',
})

export const CanvasUnlinkApproved = defineEvent({
  name: 'Canvas Unlink Approved',
  version: 1,
  description: 'User confirmed that they want the Studio document unlinked',
})

export type OpenCanvasOrigin = 'action' | 'banner'
export const CanvasOpened = defineEvent<{origin: OpenCanvasOrigin}>({
  name: 'Canvas Opened',
  version: 1,
  description: 'User clicked "Edit in Canvas"',
})
