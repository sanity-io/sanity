import React from 'react'
import {Pane} from '../../../Pane'
import {PaneHeader} from '../../../PaneHeader'

export function ListPane() {
  return (
    <Pane currentMaxWidth={350} flex={1} minWidth={280}>
      <PaneHeader title="List" />
    </Pane>
  )
}
