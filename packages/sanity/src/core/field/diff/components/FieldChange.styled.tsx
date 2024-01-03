import styled from 'styled-components'
import {rem} from '@sanity/ui'

export const FieldChangeContainer = styled.div`
  --field-change-error: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
  &[data-revert-all-changes-hover] [data-revert-all-hover]::before {
    border-left: 2px solid var(--field-change-error);
  }
`

export const DiffBorder = styled.div`
  --field-change-error: ${({theme}) => theme.sanity.color.solid.critical.enabled.bg};
  --diff-inspect-padding-xsmall: ${({theme}) => rem(theme.sanity.space[1])};
  --diff-inspect-padding-small: ${({theme}) => rem(theme.sanity.space[2])};

  position: relative;
  padding: var(--diff-inspect-padding-xsmall) 0 var(--diff-inspect-padding-xsmall)
    var(--diff-inspect-padding-small);

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-left: 1px solid var(--card-border-color);
  }

  &[data-error]:hover::before,
  &[data-revert-field-hover]:hover::before {
    border-left: 2px solid var(--field-change-error);
  }
`
