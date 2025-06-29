import {type ReleaseDocument} from '@sanity/client'
import {vars} from '@sanity/ui/css'
import {type ElementTone} from '@sanity/ui/theme'
import {type FC, type PropsWithChildren} from 'react'
import {css, styled} from 'styled-components'

import {LATEST} from '../util/const'
import {getReleaseTone} from '../util/getReleaseTone'

const StyledVersionInlineBadge = styled.span<{$tone?: ElementTone}>((props) => {
  const {$tone = 'default'} = props
  return css`
    color: ${vars.color.solid[$tone].fg[0]};
    background-color: ${vars.color.solid[$tone].bg[0]};
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
  $tone?: ElementTone
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
