import {CheckmarkIcon} from '@sanity/icons'
import {Text} from '@sanity/ui'
import {useCallback} from 'react'

import {MenuItem} from '../../../../ui-components'
import {TooltipOfDisabled} from '../../../components'
import {type DocumentFieldActionItem} from '../../../config'
import {useI18nText} from '../../../i18n'

export function FieldActionMenuItem(props: {action: DocumentFieldActionItem}) {
  const {action} = props

  const {title} = useI18nText(action)

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
        icon={action.icon}
        iconRight={action.iconRight || (action.selected ? CheckmarkIcon : undefined)}
        onClick={handleClick}
        pressed={action.selected}
        text={title}
        tone={action.tone}
      />
    </TooltipOfDisabled>
  )
}
