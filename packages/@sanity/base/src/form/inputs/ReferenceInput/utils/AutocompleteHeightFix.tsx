import styled from 'styled-components'

export const AutocompleteHeightFix = styled.div`
  // workaround for an issue that caused the autocomplete to not be the same height as the New button
  // after removing, make sure they align perfectly
  line-height: 0;

  // also adds a margin at top/bottom to keep a stable height when toggling between "preview mode" and "input mode"
  margin-top: 1px;
  margin-bottom: 1px;
`
