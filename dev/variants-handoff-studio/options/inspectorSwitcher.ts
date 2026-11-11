// The Inspector switcher: how the panels that read beside the form (Versions, History, Review changes, References, Comments) are reached in the
// open beta header. Both values keep the "<title> · N versions" pill as the way in; they differ in where the other panels are.
import {type ComponentDef} from '../design-options/types'

export const INSPECTOR_SWITCHER: ComponentDef = {
  id: 'inspectorSwitcher',
  tag: 'IS',
  title: 'Inspector switcher',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'The panels that read beside the form are Versions, History, Review changes, References and Comments. Where do you switch between them: in a tab row at the top of the inspector, or as icons in the pane header?',
  pick: 'Open a book, press the "<title> · N versions" pill, then switch panels.',
  where: 'The inspector panel (A) or the right-hand group of the pane header (B).',
  options: [
    {
      id: 'a',
      label: 'Tabs in the inspector',
      summary:
        'One tab row at the top of the inspector: Versions, History, Review changes, References, Comments (with its count). The open tab is a white chip on a grey track. The pane header keeps only Validation (when there are problems), the menu, split, expand and close.',
      oneLiner: 'A tab row at the top of the inspector.',
      status: 'candidate',
    },
    {
      id: 'b',
      label: 'Icons in the pane header',
      summary:
        'History, Review changes, References and Comments are 25 px icon buttons in the header, just before the "..." menu, after a thin divider. Versions stays the title pill. The open panel\'s button is pressed and a second click closes it. The inspector has a plain title row instead of tabs.',
      oneLiner: 'Panel icons in the header; a title row in the inspector.',
      status: 'candidate',
    },
  ],
}
