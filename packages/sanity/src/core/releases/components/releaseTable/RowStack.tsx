import {Stack} from '@sanity/ui'
import styled from 'styled-components'

export const RowStack = styled(Stack)({
  '& > *:not(:first-child)': {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    marginTop: -1,
  },

  '& > *:not(:last-child)': {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
})
