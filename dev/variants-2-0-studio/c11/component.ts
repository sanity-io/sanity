import {type ComponentDef} from '../design-options/types'

// C11 Variant detail header: David's review of the shipped Variants tool's detail page (26 Oct). A is the stock page, untouched, so
// the comparison is honest. B mounts c11/TargetingHeader.tsx through the PROPOSED VariantDetailHeaderProvider (core).
export const VARIANT_DETAIL_HEADER: ComponentDef = {
  id: 'c11',
  title: 'C11 Variant detail header',
  defaultOption: 'a',
  // "Show" (All A, All B) does not move it: it stays stock until it is set on its own.
  independent: true,
  built: true,
  scope: 'Open beta',
  cover:
    'David, 26 Oct, on the variant detail page of the Variants tool: two grey boxes ("Variant definition" and "Details") with no clear difference; "Total documents" and "Unpublished changes" add load without a use; "Created 6 days ago" is not first-class; the panels sit right of the title, and people do not read right to left; AND and OR between conditions are invisible; grey on grey may fail contrast. Option B answers each point.',
  pick: 'Compare B with A on any variant, e.g. /variants/aud-loyal-customers__loc-de-de (two dimensions).',
  where: 'The Variants tool: open a variant definition.',
  options: [
    {
      id: 'a',
      label: 'Today',
      summary:
        'The shipped page: title and description on the left; a "Variant definition" panel (conditions as label and value) and a "Details" panel (Total documents, Unpublished changes, Priority, Created) on the right, both on the grey transparent tone.',
      oneLiner: 'Two grey panels right of the title.',
      status: 'final',
    },
    {
      id: 'b',
      label: 'Targeting header',
      summary:
        'One left-aligned column: the title, "Created 6 days ago" in muted text, the description, then one bordered "Targeting" block. Each condition is a sentence ("Audience is members"; "is any of" for a list), with "and" between dimensions, and the priority under them. Total documents and Unpublished changes are gone; the table gets the heading "Documents with this variant" and the count. Only text pairs that pass 4.5:1 in light and dark.',
      oneLiner: 'One column, conditions as sentences joined by "and".',
      status: 'candidate',
      refs: 'David, 26 Oct (review of VariantDetail.tsx); contrast measured from the studio theme',
    },
  ],
}
