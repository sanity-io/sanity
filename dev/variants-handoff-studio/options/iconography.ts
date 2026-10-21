// Iconography: the marks and glyphs of the studio, one switch each, so the look can be flipped without touching the designs. First entry: the version mark
// in a list row when that row is selected (the primary blue row swallows the purple variant dot and the pale tile).
import {type ComponentDef} from '../design-options/types'

export const MARK_SELECTED: ComponentDef = {
  id: 'markSelected',
  tag: 'IC1',
  title: 'Version mark on a selected row',
  defaultOption: 'a',
  independent: true,
  built: true,
  scope: 'Iconography',
  cover:
    'In a document list the selected row is solid blue. The version mark (the documents icon with the variant dot at its corner) loses the dot there: purple on blue, on a pale tile.',
  pick: 'Select a row in the Content list and look at the mark at the right end of the row.',
  where: 'The version mark in every document list row; only the selected row changes.',
  options: [
    {
      id: 'a',
      label: 'As today',
      summary:
        'The pale tile and the purple dot, unchanged: the dot is hard to see on the blue row.',
      oneLiner: 'Pale tile, purple dot.',
      status: 'candidate',
    },
    {
      id: 'b',
      label: 'White halo',
      summary:
        'The tile stays. The dot sits in a larger white disc, so it reads as a badge on the blue row instead of a smudge.',
      oneLiner: 'Bigger white disc behind the dot.',
      status: 'candidate',
    },
    {
      id: 'c',
      label: 'Inverse mark',
      summary:
        'The tile goes: the icon is white on the blue, outlined in white, and the dot keeps a white disc. The mark reads as part of the selected row.',
      oneLiner: 'White icon on the blue, white-outlined.',
      status: 'candidate',
    },
    {
      id: 'd',
      label: 'Solid tile',
      summary:
        'The tile fills with the variant colour and the icon turns white; the dot gets a white ring. The mark is the strongest thing in the row.',
      oneLiner: 'Variant-coloured tile, white icon.',
      status: 'exploration',
    },
  ],
}

export const ICONOGRAPHY_GROUP = {label: 'Iconography', ids: ['markSelected']}
