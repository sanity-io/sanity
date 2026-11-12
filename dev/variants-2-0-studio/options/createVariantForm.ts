// CV, the "Create variant" form of the version inventory (13 Nov 2026). B is the signed-off spec ("A final", Storybook branch
// explorations/c4-create-variant-options at 59aefbe2eb, FINAL_SPEC and OptionAFinal). A is the form core ships. Both are core's own form: the option only
// supplies the PROPOSED CreateVariantFormContext (packages/sanity/src/_singletons/context/CreateVariantFormContext.ts), so the filter, the "Has N" and
// "Other variants" groups and the create action are the same code either way.
import {type ComponentDef} from '../design-options/types'

export const CREATE_VARIANT_FORM: ComponentDef = {
  id: 'createVariantForm',
  tag: 'CV',
  title: 'Create variant form',
  defaultOption: 'b',
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'The form behind "Create variant" in the version inventory. A is the form as it ships. B is the signed-off spec: an inset card with the header "New variant of [document]", three titled selects (Variant, Add to, Start from), no title icons, and Cancel and Create variant at the bottom.',
  pick: 'Open a book, open Manage versions in the bottom bar, press Create variant. Switch A and B here and press it again. Cancel closes the form; nothing is created.',
  where: 'The Manage versions panel, under its header.',
  options: [
    {
      id: 'a',
      label: 'As shipped',
      summary:
        'Core\'s form: a header with the title and "A new variant of [document]", three rows with an icon, a label and a description, and the first variant already chosen.',
      oneLiner: 'The shipped form.',
      status: 'candidate',
    },
    {
      id: 'b',
      label: 'Inset card (signed off)',
      summary:
        'An inset card with a border and a tinted ground. Header "New variant of [document]". Three fields, each a title over a full-width select the size of a Studio input (35px, 15px text): Variant ("Choose who sees it", starts empty), Add to (the current perspective, Drafts), Start from (Nearest version, with "Copies from Default in Drafts" under it). Create variant stays off until a variant is picked. Escape and Cancel close it.',
      oneLiner: 'The signed-off spec.',
      status: 'final',
      refs: 'Storybook explorations/c4-create-variant-options 59aefbe2eb, "A final"; design record: Inside the Version Inventory, chapter 13',
    },
  ],
}
