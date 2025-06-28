import {Card} from '@sanity/ui'
import {vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

export const ThreadCard = styled(Card).attrs({padding: 3, radius: 3, sizing: 'border'})`
  background-color: ${vars.color.tinted.default.bg[1]};

  &[data-active='true'] {
    background-color: ${vars.color.tinted.default.bg[2]};
  }
`
