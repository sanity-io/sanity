import {type SchemaType} from '@sanity/types'
import {Menu} from '@sanity/ui'

import {MenuButton} from '../../../../ui-components/menuButton/MenuButton'
import {ContextMenuButton} from '../../../components/contextMenuButton/ContextMenuButton'
import {type Schedule} from '../../types'
import ContextMenuItems from './ContextMenuItems'

interface Props {
  actions?: {
    clear?: boolean
    delete?: boolean
    edit?: boolean
    execute?: boolean
  }
  onDelete?: () => void
  onEdit?: () => void
  schedule: Schedule
  schemaType: SchemaType
}

export const ScheduleContextMenu = (props: Props) => {
  const {actions, onDelete, onEdit, schedule, schemaType} = props

  return (
    <MenuButton
      button={<ContextMenuButton />}
      id="contextMenu"
      menu={
        <Menu>
          <ContextMenuItems
            actions={actions}
            onDelete={onDelete}
            onEdit={onEdit}
            schedule={schedule}
            schemaType={schemaType}
          />
        </Menu>
      }
      popover={{placement: 'left', portal: true, tone: 'default'}}
    />
  )
}
