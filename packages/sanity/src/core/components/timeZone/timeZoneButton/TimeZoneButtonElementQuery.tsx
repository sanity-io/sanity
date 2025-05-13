import {ElementQuery} from '@sanity/ui'
import {styled} from 'styled-components'

const ButtonTimeZoneElementQuery = styled(ElementQuery)`
  .button-small {
    display: block;
  }
  .button-large {
    display: none;
  }

  &[data-eq-min~='2'] {
    .button-small {
      display: none;
    }
    .button-large {
      display: block;
    }
  }
`

export default ButtonTimeZoneElementQuery
