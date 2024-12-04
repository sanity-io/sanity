import {type BadgeTone} from '@sanity/ui'
import {css, styled} from 'styled-components'

/**
 * @internal
 */
export const VersionInlineBadge = styled.span<{$tone?: BadgeTone}>((props) => {
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
