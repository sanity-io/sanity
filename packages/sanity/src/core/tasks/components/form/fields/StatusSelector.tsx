import {CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {type Path, type TitledListValue} from '@sanity/types'
import {Menu} from '@sanity/ui'
import {type ForwardedRef, forwardRef} from 'react'

import {Button, MenuButton, MenuItem} from '../../../../../ui-components'
import {type FormPatch, type PatchEvent, set} from '../../../../form/patch'
import {TASK_STATUS} from '../../../constants/TaskStatus'

export const StatusMenuButton = forwardRef(function StatusMenuButton(
  props: {value: string | undefined; options: TitledListValue<string>[]},
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {value, options, ...rest} = props
  const selectedOption = options.find((option) => option.value === value)
  const icon = TASK_STATUS.find((status) => status.value === value)?.icon
  return (
    <Button
      {...rest}
      ref={ref}
      tooltipProps={null}
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
                icon={typeof option.value === 'string' ? icon || CircleIcon : CircleIcon}
                text={option.title || option.value}
                pressed={isSelected}
                iconRight={isSelected && <CheckmarkIcon />}
                // eslint-disable-next-line react/jsx-no-bind
                onClick={() => onChange(set(option.value, path))}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
