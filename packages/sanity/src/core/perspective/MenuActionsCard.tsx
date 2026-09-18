import {Card} from '@sanity/ui'
import {styled} from 'styled-components'

/**
 * The action block at the foot of a perspective menu, shared by both of them.
 *
 * It exists as one component because it kept drifting as two. Over one review pass the release
 * menu's block and the variant menu's block disagreed in turn about their padding, whether they
 * were sticky, how far their icons were inset, and whether their border doubled up against the
 * section above - each fixed in one menu and left wrong in the other. Everything below was worked
 * out once, for the release menu, and is now simply what both get.
 *
 * **Sticky at the bottom.** The actions are how you leave the menu, so they stay reachable at any
 * scroll position. The list scrolls underneath them.
 *
 * **Pulled up by one border width.** Every element that can precede this card draws its own bottom
 * border - a release or variant section, the published/drafts card, the agent bundle card, the
 * filter block - so this card's top border landed against one and the pair read as a single 2px
 * rule. The overlap hides the one underneath, and the opaque background is what makes that work.
 * The top border itself has to stay: rows pass beneath this card as the list scrolls, and that
 * border is the only thing separating them.
 *
 * **11px of icon inset**, which is off the 4px scale on purpose. Icons align on ink, not on boxes.
 * The shared `ui-components/MenuItem` hardcodes its inset to a scale step and applies it to an
 * inner `Box`, so a `style` on the item stacks with it instead of replacing it - this selector
 * reaches the box that actually carries the padding. 11px puts a calendar's ink at 13.6px from the
 * panel edge, in column with the rows above it, where the scale steps either side land 3.4px short
 * or 2px long.
 *
 * That single value only works while both menus carry icons from `@sanity/icons`, which are all
 * drawn at a comparable fraction of their box. A glyph drawn smaller - the temporary rhombi sit at
 * 0.37 where icon-set glyphs are 0.56-0.68 - renders as small as a status icon at this size, and
 * no inset fixes that. Fix the glyph, not this.
 */
export const MenuActionsCard = styled(Card)`
  position: sticky;
  bottom: 0;
  z-index: 2;
  background: var(--card-bg-color);
  margin-top: -1px;

  [data-ui='MenuItem'] > [data-ui='Box'] {
    padding-left: 11px;
  }
`
