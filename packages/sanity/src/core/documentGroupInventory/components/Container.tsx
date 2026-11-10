import {styled} from 'styled-components'

import {inventoryContainerName} from './CreateVariant/CreateVariant.css'

/**
 * A flex column that fills its host and lets `Body` scroll. The host must be a flex column with
 * a bounded block size (a height, or a max-height).
 */
export const Container = styled.div`
  container-name: ${inventoryContainerName};
  container-type: inline-size;
  display: flex;
  flex: 1 1 auto;
  flex-direction: column;
  min-block-size: 0;
`
