import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const ChangeListWrapper = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1fr);
`

export const GroupChangeContainer = styled.div`
  --field-change-error: ${vars.color.solid.critical.bg[0]};
  --diff-inspect-padding-xsmall: ${vars.space[1]};
  --diff-inspect-padding-small: ${vars.space[2]};

  position: relative;
  padding: var(--diff-inspect-padding-xsmall) var(--diff-inspect-padding-small);

  &::before {
    content: '';
    display: block;
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    border-left: 1px solid ${vars.color.border};
  }

  &[data-error]:hover::before,
  &[data-revert-group-hover]:hover::before,
  &[data-revert-all-groups-hover]::before {
    border-left: 2px solid var(--field-change-error);
  }
`
