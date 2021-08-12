import {Box, ElementQuery} from '@sanity/ui'
import styled from 'styled-components'

export const MetadataBox = styled(ElementQuery)`
  /* To be overridden by JS below */
  --session-layout-width: auto;

  transition: transform 200ms;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;

  /* Hide review changes button when not changed */
  transform: translate3d(calc(0px - var(--session-layout-width) - 12px), 0, 0);

  /* Transition a fixed distance on smaller screens */
  &[data-eq-max~='0'] {
    transform: translate3d(-27px, 0, 0);
  }

  &[data-changed] {
    transform: translate3d(0, 0, 0);
  }
`

export const ReviewChangesBadgeBox = styled.div`
  display: none;
  transition: opacity 100ms;
  opacity: 1;

  div:not([data-changed]) > & {
    opacity: 0;
  }

  /* Show on small screens */
  [data-eq-max~='0'] > & {
    display: block;
  }
`

export const ReviewChangesButtonBox = styled.div`
  min-width: min-content;
  transition: opacity 100ms;
  opacity: 1;

  div:not([data-changed]) > & {
    pointer-events: none;
    opacity: 0;
  }

  /* Hide on small screens */
  [data-eq-max~='0'] > & {
    display: none;
  }

  /* Flex when there is no badges box */
  [data-eq-min~='0'][data-eq-max~='1'] > & {
    flex: 1;
  }
`

export const BadgesBox = styled(Box)`
  line-height: 0;

  /* Hide on small screens */
  [data-eq-max~='1'] > & {
    display: none;
  }
`
