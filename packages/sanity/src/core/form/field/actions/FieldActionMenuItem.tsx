import {MenuItem, Text} from '@sanity/ui'
import React, {useCallback} from 'react'
import {CheckmarkIcon} from '@sanity/icons'
import {TooltipOfDisabled} from '../../../components'
import {DocumentFieldActionItem} from '../../../config'
import {useTranslation} from '../../../i18n'

export function FieldActionMenuItem(props: {action: DocumentFieldActionItem}) {
  const {action} = props

  const {t} = useTranslation(action.i18n?.ns)
  const title = action.i18n
    ? t(action.i18n.key, {
        ns: action.i18n.ns,
        defaultValue: action.title, // fallback
      })
    : action.title

  const handleClick = useCallback(() => {
    action.onAction()
  }, [action])

  const disabledTooltipContent = typeof action.disabled === 'object' && (
    <Text size={1}>{action.disabled.reason}</Text>
  )

  return (
    <TooltipOfDisabled content={disabledTooltipContent} placement="left">
      <MenuItem
        disabled={Boolean(action.disabled)}
        fontSize={1}
        icon={action.icon}
        iconRight={action.iconRight || (action.selected ? CheckmarkIcon : undefined)}
        onClick={handleClick}
        padding={3}
        pressed={action.selected}
        space={3}
        text={title}
        tone={action.tone}
      />
    </TooltipOfDisabled>
  )
}
