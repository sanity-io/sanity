import styled from 'styled-components'

export const RootDiv = styled.div`
  display: inline-flex;
  align-items: center;
  vertical-align: bottom;
  line-height: 1;
  max-width: 100%;
`

export const MediaDiv = styled.div`
  display: inline-block;
  vertical-align: bottom;
  width: 1em;

  &:empty {
    display: none;
  }

  & img {
    width: 1em;
    display: block;
    object-fit: cover;
    border-radius: ${({theme}) => theme.sanity.radius[1]}px;
    margin-right: ${({theme}) => theme.sanity.space[1]}px;
  }

  & svg {
    display: block;
    font-size: calc(14 / 16 * 1em);
    margin: 1px 0;

    &[data-sanity-icon] {
      font-size: calc(18 / 16 * 1em);
      margin: calc(1px + (2 / 18 * -1em)) 0;
    }
  }
`

export const TextSpan = styled.div`
  font-size: calc(14 / 16 * 1em);
  font-weight: ${({theme}) => theme.sanity.fonts.text.weights.medium};
  overflow: hidden;
  padding: 0.1em;
  margin: -0.1em;
  display: inline-flex;
  align-items: center;

  & > div {
    display: inline-block;
    width: 100%;
    white-space: nowrap;
    text-overflow: ellipsis;
    overflow: hidden;
    padding: 0.1em;
    margin: -0.1em;

    span {
      margin-left: 0.25em;
      margin-right: 0.25em;
      vertical-align: top;

      &:empty {
        display: none;
      }
    }
  }
`
