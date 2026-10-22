import {type BadgeTone, Card} from '@sanity/ui'
import {type FC, type PropsWithChildren, type ReactNode} from 'react'
import {css, styled} from 'styled-components'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'

const StyledVersionInlineBadge = styled.span<{$tone?: BadgeTone}>((props) => {
  const {$tone} = props
  return css`
    color: var(--card-badge-${$tone ?? 'default'}-fg-color);
    /* The chip is its own tone scope: its glyph takes the chip's icon colour, never the surrounding card's (a caution banner turned a
       purple chip's rhombus yellow). A glyph that sets its own colour (a release's) keeps it. */
    --card-icon-color: var(--card-badge-${$tone ?? 'default'}-icon-color);
    background-color: var(--card-badge-${$tone ?? 'default'}-bg-color);
    border-radius: 3px;
    text-decoration: none;
    padding: 0px 4px;
    font-weight: 500;
    /* PROPOSED: a chip never wraps mid-name; a very long name ends in an ellipsis. It sits on the text's baseline. */
    display: inline-flex;
    align-items: baseline;
    gap: 4px;
    max-width: 180px;
    vertical-align: baseline;
    white-space: nowrap;

    [data-version-badge-glyph] {
      align-self: center;
      display: inline-flex;
      flex: none;
    }
    /* Text pulls an icon in by 6px a side, narrower than a clock or bolt is drawn, so the glyph ran into the name: its box is the drawn
       glyph's (4px a side of the 25 unit icon), and the gap is 4px from it. */
    [data-version-badge-glyph] svg {
      margin-inline: -4px;
    }
    [data-version-badge-text] {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    [data-version-badge-suffix] {
      flex: none;
    }
  `
})

/**
 * @internal
 */
export const VersionInlineBadge = ({
  children,
  $tone,
  icon,
  suffix,
}: PropsWithChildren<{
  $tone?: BadgeTone
  /** PROPOSED: a glyph before the name (the release's or the version's), in its own tone. */
  icon?: ReactNode
  /** PROPOSED: what follows the name and is never cut ("· 20 Nov", a scheduled release's date): the name truncates first. */
  suffix?: ReactNode
}>) => (
  // PROPOSED: the chip is its own tone scope. Inside a tinted card (a purple or yellow banner) every badge colour is drawn from that card's
  // palette, so a neutral release chip in a purple banner read purple, like the variant chip beside it, and a glyph took the banner's
  // icon colour. A transparent default-tone card resets the palette, so the chip's colours are its own tone's wherever it sits.
  <Card
    as="span"
    data-version-badge=""
    style={{background: 'transparent', display: 'inline', verticalAlign: 'baseline'}}
    tone="default"
  >
    <StyledVersionInlineBadge $tone={$tone}>
      {icon ? <span data-version-badge-glyph="">{icon}</span> : null}
      <span data-version-badge-text="">{children}</span>
      {suffix ? <span data-version-badge-suffix="">{suffix}</span> : null}
    </StyledVersionInlineBadge>
  </Card>
)

/**
 * @internal
 */
export const getVersionInlineBadge = (release?: TargetPerspective) => {
  const tone = getReleaseTone(release ?? LATEST)

  const ReturnComponent: FC<PropsWithChildren> = ({children}) => (
    <VersionInlineBadge $tone={tone}>{children}</VersionInlineBadge>
  )

  return ReturnComponent
}
