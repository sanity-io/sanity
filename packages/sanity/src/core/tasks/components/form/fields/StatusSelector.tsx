import {CheckmarkIcon} from '@sanity/icons/Checkmark'
import {CircleIcon} from '@sanity/icons/Circle'
import {useTelemetry} from '@sanity/telemetry/react'
import {type Path, type TitledListValue} from '@sanity/types'
import {useCallback, type RefAttributes} from 'react'

import {Button} from '../../../../../ui-components/button/Button'
import {Menu} from '../../../../../ui-components/menu/Menu'
import {MenuButton} from '../../../../../ui-components/menuButton/MenuButton'
import {MenuItem} from '../../../../../ui-components/menuItem/MenuItem'
import {set} from '../../../../form/patch/patch'
import {type PatchEvent} from '../../../../form/patch/PatchEvent'
import {type FormPatch} from '../../../../form/patch/types'
import {useTranslation} from '../../../../i18n/hooks/useTranslation'
import {TaskStatusChanged} from '../../../__telemetry__/tasks.telemetry'
import {TASK_STATUS} from '../../../constants/TaskStatus'
import {tasksLocaleNamespace} from '../../../i18n'

const STATUS_TITLE_KEYS: Record<string, string | undefined> = {
  open: 'form.input.status.open.text',
  closed: 'form.input.status.closed.text',
}

function StatusMenuButton(
  props: {
    value: string | undefined
    options: TitledListValue<string>[]
  } & RefAttributes<HTMLButtonElement>,
) {
  const {t} = useTranslation(tasksLocaleNamespace)
  const {ref, value, options, ...rest} = props
  const selectedOption = options.find((option) => option.value === value)
  const icon = TASK_STATUS.find((status) => status.value === value)?.icon
  const statusTitleKey = value ? STATUS_TITLE_KEYS[value] : undefined
  return (
    <Button
      {...rest}
      ref={ref}
      tooltipProps={{content: t('form.input.status.button.tooltip')}}
      icon={icon}
      text={statusTitleKey ? t(statusTitleKey) : selectedOption?.title || value}
      tone="default"
      mode="ghost"
    />
  )
}

interface StatusSelectorProps {
  value: string | undefined
  path: Path
  options: TitledListValue<string>[]
  onChange: (patch: FormPatch | PatchEvent | FormPatch[]) => void
}

export function StatusSelector(props: StatusSelectorProps) {
  const {value, onChange, options, path} = props
  const telemetry = useTelemetry()
  const {t} = useTranslation(tasksLocaleNamespace)

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
            const titleKey = option.value ? STATUS_TITLE_KEYS[option.value] : undefined
            return (
              <MenuItem
                key={option.title}
                icon={typeof option.value === 'string' ? icon || CircleIcon : CircleIcon}
                text={titleKey ? t(titleKey) : option.title || option.value}
                pressed={isSelected}
                iconRight={isSelected && <CheckmarkIcon />}
                onClick={() => handleStatusChange(option.value)}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
