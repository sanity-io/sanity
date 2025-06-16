// eslint-disable-next-line no-restricted-imports -- This has some special implementation needed from @sanity/ui
import {Dialog} from '@sanity/ui'
import {styled} from 'styled-components'

export const AppDialog = styled(Dialog)`
  [data-ui='Card'] {
    position: absolute;
    top: 0;
    right: 0;
    left: 0;
    bottom: 0;
  }
  [data-ui='Card']:first-child {
    flex: 1;
  }
`
