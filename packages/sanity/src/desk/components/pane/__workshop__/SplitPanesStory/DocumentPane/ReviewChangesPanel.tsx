import {CloseIcon} from '@sanity/icons'
import {Flex} from '@sanity/ui'
import React from 'react'
import {Button} from '../../../../../../ui'
import {PaneHeader} from '../../../PaneHeader'
import {usePane} from '../../../usePane'

export function ReviewChangesPanel(props: {onClose: () => void}) {
  const {collapsed} = usePane()

  return (
    <Flex
      direction="column"
      flex={1}
      hidden={collapsed}
      style={{
        borderLeft: '1px dashed var(--card-border-color)',
        overflow: 'hidden',
        minWidth: 320,
      }}
    >
      <PaneHeader
        actions={<Button icon={CloseIcon} mode="bleed" onClick={props.onClose} />}
        title="Review changes"
      />
    </Flex>
  )
}
