import {ElementQuery} from '@sanity/ui'
import {styled} from 'styled-components'

const DateWithTooltipElementQuery: typeof ElementQuery = styled(ElementQuery)`
  .date-small {
    display: inline;
  }
  .date-medium {
    display: none;
  }
  .date-large {
    display: none;
  }

  &[data-eq-min~='1'] {
    .date-small {
      display: none;
    }
    .date-medium {
      display: inline;
    }
    .date-large {
      display: none;
    }
  }

  &[data-eq-min~='2'] {
    .date-small {
      display: none;
    }
    .date-medium {
      display: none;
    }
    .date-large {
      display: inline;
    }
  }
`

export default DateWithTooltipElementQuery
