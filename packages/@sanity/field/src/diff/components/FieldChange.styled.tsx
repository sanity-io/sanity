import styled from 'styled-components'
import {Box} from '@sanity/ui'

export const BoxContentWrapper = styled(Box)`
  /* max width is needed for smaller screens where the popover will otherwise be considered "larger" than
 the change area making it adjust horizontally when it's not needed */
  max-width: 295px;
`
