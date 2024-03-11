import {CheckmarkCircleIcon, CheckmarkIcon, CircleIcon} from '@sanity/icons'
import {Menu} from '@sanity/ui'
import {type ForwardedRef, forwardRef, type ReactNode} from 'react'
import {
  type FormPatch,
  isString,
  type PatchEvent,
  type Path,
  set,
  type TitledListValue,
} from 'sanity'

import {Button, MenuButton, MenuItem} from '../../../../../../ui-components'

// TODO: support customizing icons and options.
const OPTION_ICONS: Record<string, ReactNode> = {
  closed: <CheckmarkCircleIcon />,
  open: <CircleIcon />,
}

export const StatusMenuButton = forwardRef(function StatusMenuButton(
  props: {value: string | undefined; options: TitledListValue<string>[]},
  ref: ForwardedRef<HTMLButtonElement>,
) {
  const {value, options} = props
  const selectedOption = options.find((option) => option.value === value)
  return (
    <Button
      {...props}
      ref={ref}
      tooltipProps={null}
      icon={value && OPTION_ICONS[value]}
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
            return (
              <MenuItem
                key={option.title}
                icon={
                  isString(option.value) ? OPTION_ICONS[option.value] || CircleIcon : CircleIcon
                }
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
