import {type ComponentDef} from '../design-options/types'

// C15 Base document name (29 Oct, Ash and Faheem in Slack). The base document is "All users" in the navbar pill, "All users (Default)" in
// menus and "Base · all visitors" in the inventory. Ash: land on one name, and "all users/visitors" is not accurate, because a visitor who
// matches a variant does not get the base. Faheem: "Base" alone says little in a pill that is always on screen. Each option names the
// three forms: the pill (always visible), menus, and the inventory. Core's own two strings follow after a reload (c15/baseName.ts).
export const BASE_DOCUMENT_NAME: ComponentDef = {
  id: 'c15',
  title: 'C15 Base document name',
  defaultOption: 'c',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'What the base document is called: the version every visitor gets unless a variant matches them. Today it has three names. Each option puts one name in the pill that is always on screen, and the same name, with or without an explanation, in menus and the inventory.',
  pick: 'Changing it reloads the studio, so core text (Compare versions, version titles, field marks) matches the pills, menus and inventory.',
  where:
    'The Variants pill in the navbar and the document pills (with no variant chosen), the Variants menu\'s first row, the version popover\'s first line, the inventory rows and Create version, and the "Back to" link and button.',
  options: [
    {
      id: 'a',
      label: 'As today',
      summary: 'Pill: "All users". Menus: "All users (Default)". Inventory: "Base · all visitors".',
      oneLiner: 'Three names.',
      status: 'candidate',
    },
    {
      id: 'b',
      label: 'Base',
      summary:
        '"Base" everywhere. The model\'s word: short and accurate, but it says little to an editor on its own.',
      oneLiner: 'Base.',
      status: 'candidate',
      refs: 'Ash, Slack 29 Oct',
    },
    {
      id: 'c',
      label: 'Default',
      summary:
        '"Default" everywhere. Core\'s word today, in brackets; in a pill it reads as the choice a dropdown starts on.',
      oneLiner: 'Default.',
      status: 'final',
      refs: 'Ash, Slack 29 Oct; Faheem signed off 29 Oct (iconography for the default can come later)',
    },
    {
      id: 'd',
      label: 'Default, explained where there is room',
      summary:
        'Pill: "Default". Menus and the inventory: "Default · served when no variant matches", which says when a visitor gets it (Andrej\'s Served map).',
      oneLiner: 'Default; the rule in menus.',
      status: 'candidate',
      refs: 'Data, 29 Oct',
    },
  ],
}
