import {defineEvent} from '@sanity/telemetry'

export type DiffTypesCount = Record<string, number>

export const CanvasLinkCtaClicked = defineEvent({
  name: 'Canvas Link CTA Clicked',
  version: 1,
  description: 'The "Link to Canvas" button is clicked.',
})

export type CanvasLinkOrigin = 'redirect' | 'diff-dialog'

export const CanvasLinkRedirected = defineEvent<{
  origin: CanvasLinkOrigin
  diffs?: DiffTypesCount
}>({
  name: 'Canvas Link Redirected',
  version: 1,
  description: 'The user is redirected to the canvas studio-import page',
})

export const CanvasLinkDialogDiffsShown = defineEvent({
  name: 'Canvas Link Dialog Diffs Shown',
  version: 1,
  description: 'The diffs dialog is shown',
})

export const CanvasLinkDialogRejected = defineEvent<{
  diffs: DiffTypesCount
}>({
  name: 'Canvas Link Dialog Rejected',
  version: 1,
  description: 'User clicked "Cancel" in the "Link to Canvas" dialog after seeing the diffs',
})

export const CanvasUnlinkCtaClicked = defineEvent({
  name: 'Canvas Unlink CTA Clicked',
  version: 1,
  description: 'User clicked "Unlink" action',
})

export const CanvasUnlinkApproved = defineEvent({
  name: 'Canvas Unlink Approved',
  version: 1,
  description: 'User confirmed that they want the Studio document unlinked',
})

export type OpenCanvasOrigin = 'action' | 'banner'
export const CanvasOpened = defineEvent<{origin: OpenCanvasOrigin}>({
  name: 'Canvas Opened from studio',
  version: 1,
  description: 'User clicked "Edit in Canvas"',
})
