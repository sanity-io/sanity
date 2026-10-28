import {type ComponentDef} from '../design-options/types'

// C14 Manage versions placement (28 Oct, Faheem). The Handoff Studio moved Manage versions from the header to the bottom action bar (2b872d0099).
// Core hides that bar when the chosen variant has no version in the perspective (a variant missing from a release, say), so the button went with
// it and the inventory had no visible entry. A is the header, as here today; B is the Handoff Studio's bottom bar, gap included; C keeps the bar,
// with only Manage versions, when there is no version (PROPOSED pane extension slots footerLead and footerLeadAlways). Follow-up: SAPP-4724.
export const MANAGE_VERSIONS_PLACEMENT: ComponentDef = {
  id: 'c14',
  title: 'C14 Manage versions placement',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    "Where the Manage versions button lives. In the bottom action bar it sits with the document's actions, but core hides that bar when the variant has no version in the perspective, so the button disappears exactly when an editor needs the inventory. Option C keeps the bar with only the button in that case.",
  pick: 'Needs a C4 option that opens the inventory as a panel (C4 E, or Open beta (locked)). To see the gap, pick a variant and a release the document has no version of that variant in.',
  where:
    'Open a document. Header: after the presence avatars. Bottom bar: before Publish. Then pick a variant with no version in a release (the banner says so) and look at the bottom bar.',
  options: [
    {
      id: 'a',
      label: 'Header',
      summary: 'Manage versions in the pane header, before the "..." menu. Always there.',
      oneLiner: 'In the header.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Bottom bar',
      summary:
        'Manage versions in the bottom action bar, before Publish, as the Handoff Studio has it. With no version in the perspective, core hides the bar and the button with it: the inventory is then reachable only through Versions in the "..." menu.',
      oneLiner: 'Before Publish; gone when there is no version.',
      status: 'candidate',
      refs: 'Handoff Studio 2b872d0099',
    },
    {
      id: 'c',
      label: 'Bottom bar, always',
      summary:
        'As B, but with no version in the perspective the bottom bar stays, with only Manage versions at its right end: no status line, no Publish. The button never moves and is never shown twice.',
      oneLiner: 'Before Publish; alone in the bar when there is no version.',
      status: 'candidate',
      refs: 'SAPP-4724 comment, 28 Oct',
    },
  ],
}
