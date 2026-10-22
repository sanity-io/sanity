import {type BadgeTone} from '@sanity/ui'
import {type FC, type PropsWithChildren, type ReactNode} from 'react'
import {css, styled} from 'styled-components'

import {type TargetPerspective} from '../../perspective/types'
import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'

const StyledVersionInlineBadge = styled.span<{$tone?: BadgeTone}>((props) => {
  const {$tone} = props
  return css`
    color: var(--card-badge-${$tone ?? 'default'}-fg-color);
    background-color: var(--card-badge-${$tone ?? 'default'}-bg-color);
    border-radius: 3px;
    text-decoration: none;
    padding: 0px 2px;
    font-weight: 500;
    /* PROPOSED: a chip never wraps mid-name; a very long name ends in an ellipsis. It sits on the text's baseline. */
    display: inline-flex;
    align-items: baseline;
    gap: 3px;
    max-width: 180px;
    vertical-align: baseline;
    white-space: nowrap;

    [data-version-badge-glyph] {
      align-self: center;
      display: inline-flex;
      flex: none;
    }
    [data-version-badge-text] {
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
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
}: PropsWithChildren<{
  $tone?: BadgeTone
  /** PROPOSED: a glyph before the name (the release's or the version's), in its own tone. */
  icon?: ReactNode
}>) => (
  <StyledVersionInlineBadge $tone={$tone}>
    {icon ? <span data-version-badge-glyph="">{icon}</span> : null}
    <span data-version-badge-text="">{children}</span>
  </StyledVersionInlineBadge>
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
