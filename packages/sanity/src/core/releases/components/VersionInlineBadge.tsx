import {type BadgeTone} from '@sanity/ui'
import {type FC, type PropsWithChildren} from 'react'
import {css, styled} from 'styled-components'

import {type ReleaseDocument} from '../store/types'
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
  `
})

/**
 * @internal
 */
export const VersionInlineBadge = ({
  children,
  $tone,
}: PropsWithChildren<{
  $tone?: BadgeTone
}>) => <StyledVersionInlineBadge $tone={$tone}>{children}</StyledVersionInlineBadge>

/**
 * @internal
 */
export const getVersionInlineBadge = (release?: ReleaseDocument) => {
  const tone = getReleaseTone(release ?? LATEST)

  const ReturnComponent: FC<PropsWithChildren> = ({children}) => (
    <VersionInlineBadge $tone={tone}>{children}</VersionInlineBadge>
  )

  return ReturnComponent
}
