import {CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {useTelemetry} from '@sanity/telemetry/react'
import {Menu} from '@sanity/ui'
import {type ForwardedRef, forwardRef, useCallback} from 'react'
import {
  type FormPatch,
  isString,
  type PatchEvent,
  type Path,
  set,
  type TitledListValue,
  useTranslation,
} from 'sanity'

import {Button, MenuButton, MenuItem} from '../../../../../../ui-components'
import {TaskStatusChanged} from '../../../../../__telemetry__/tasks.telemetry'
import {tasksLocaleNamespace} from '../../../../../i18n'
import {TASK_STATUS} from '../../../constants/TaskStatus'

export const StatusMenuButton = forwardRef(function StatusMenuButton(
  props: {value: string | undefined; options: TitledListValue<string>[]},
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {t} = useTranslation(tasksLocaleNamespace)
  const {value, options, ...rest} = props
  const selectedOption = options.find((option) => option.value === value)
  const icon = TASK_STATUS.find((status) => status.value === value)?.icon
  return (
    <Button
      {...rest}
      ref={ref}
      tooltipProps={{content: t('form.input.status.button.tooltip')}}
      icon={icon}
      text={selectedOption?.title || value}
      tone="default"
      mode="ghost"
    />
  )
})

interface StatusSelectorProps {
  value: string | undefined
  path: Path
  options: TitledListValue<string>[]
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
}

export function StatusSelector(props: StatusSelectorProps) {
  const {value, onChange, options, path} = props
  const telemetry = useTelemetry()

  const handleStatusChange = useCallback(
    (next?: string) => {
      onChange(set(next, path))
      telemetry.log(TaskStatusChanged, {from: value, to: next})
    },
    [onChange, path, telemetry, value],
  )

  return (
    <MenuButton
      button={<StatusMenuButton value={value} options={options} />}
      id={`reference-menuButton`}
      menu={
        <Menu>
          {options.map((option) => {
            const isSelected = value === option.value
            const icon = TASK_STATUS.find((status) => status.value === option.value)?.icon
            return (
              <MenuItem
                key={option.title}
                icon={isString(option.value) ? icon || CircleIcon : CircleIcon}
                text={option.title || option.value}
                pressed={isSelected}
                iconRight={isSelected && <CheckmarkIcon />}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => handleStatusChange(option.value)}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
