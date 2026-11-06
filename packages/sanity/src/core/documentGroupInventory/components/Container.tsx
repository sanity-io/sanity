import {styled} from 'styled-components'

/**
 * A flex column that fills its host and lets `Body` scroll. The host must be a flex column with
 * a bounded block size (a height, or a max-height).
 */
export const Container = styled.div`
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-block-size: 0;
`
