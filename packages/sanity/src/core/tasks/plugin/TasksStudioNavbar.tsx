/* eslint-disable @sanity/i18n/no-attribute-string-literals */
import {useCallback} from 'react'
import {PanelRightIcon} from '@sanity/icons'
import {Button} from '../../../ui-components'
import {NavbarProps} from '../../config'
import {useTasks} from '../../tasks'

export function TasksStudioNavbar(props: NavbarProps) {
  const {open, setOpen} = useTasks()

  const handleClick = useCallback(() => setOpen(!open), [open, setOpen])

  const navbar = props.renderDefault({
    ...props,
    // eslint-disable-next-line camelcase
    __internal_tasks_button: (
      <Button text="Tasks" onClick={handleClick} iconRight={PanelRightIcon} />
    ),
  })

  return navbar
}
