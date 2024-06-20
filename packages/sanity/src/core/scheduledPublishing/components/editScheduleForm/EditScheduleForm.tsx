import {Stack} from '@sanity/ui'
import {type PropsWithChildren} from 'react'

import {type ScheduleFormData} from '../../types'
import ScheduleForm from './ScheduleForm'

interface Props {
  onChange?: (formData: ScheduleFormData) => void
  value?: ScheduleFormData | null
}

/**
 * Form for editing a schedule for a document when scheduled publishing is enabled.
 * @internal
 */
export function EditScheduleForm(props: PropsWithChildren<Props>) {
  const {onChange, value} = props

  return (
    <Stack space={4}>
      {props.children}
      <ScheduleForm onChange={onChange} value={value} />
    </Stack>
  )
}
