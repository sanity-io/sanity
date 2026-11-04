// Document tabs: a future-state exploration for the Studio shell (Studio Core UX, Figma page D · Frame, directions F3 and F4). Not an open beta
// design. It measures a tab bar that nobody has checked yet: its keyboard model (K9) and what it costs to reach the next document with a panel
// open (K4). Spec: docs/initiatives/core-studio-ux/projects/D-FRAME-SECTIONS-B-F-RESULT.md. Keyboard model: tabs/KEYBOARD-MODEL.md.
import {type ComponentDef} from '../design-options/types'

export const DOC_TABS: ComponentDef = {
  id: 'docTabs',
  tag: 'DT',
  title: 'Document tabs',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Future state',
  cover:
    'Opening a second document from a list or a reference adds a tab, not a pane. Tabs switch, close and reorder; one tab can be split beside the active one. The list folds into a breadcrumb.',
  pick: 'Not decided. Open a book, open a second one from the list, then use the tab bar with the keyboard (see tabs/KEYBOARD-MODEL.md).',
  where: 'A bar above the Structure tool (a document open).',
  options: [
    {
      id: 'a',
      label: 'Off',
      summary:
        'The stock panes: a list, then a document pane; a reference opens another pane beside.',
      oneLiner: 'Stock panes.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Tabs (F4)',
      summary:
        'The list folds into a breadcrumb ("Books ▾"). A second document, from the list or a reference, opens as a tab. One tab can be split beside the active one. The tab bar is one Tab stop; arrow keys move between tabs.',
      oneLiner: 'Breadcrumb frame and document tabs.',
      status: 'exploration',
      refs: 'Figma Studio Core UX 3052:2, D · Frame F4 3139:607',
    },
    {
      id: 'c',
      label: 'Breadcrumb only (F1)',
      summary:
        'The list folds into a breadcrumb, with no tabs: a second document replaces the first. Kept to measure K4 (the next document with a panel open) against the tabs.',
      oneLiner: 'The list folds; no tabs.',
      status: 'exploration',
      refs: 'Figma Studio Core UX 3052:2, D · Frame F1 3139:208',
    },
  ],
}
