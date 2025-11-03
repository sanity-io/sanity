import {LaunchIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {getVarName, vars} from '@sanity/ui/css'
import {styled} from 'styled-components'

import {Translate, useTranslation} from '../../../i18n'
import {tasksLocaleNamespace} from '../../i18n'

const FEEDBACK_FORM_LINK = 'https://snty.link/tasks-feedback'

const Span = styled.span`
  margin-right: 0.2em;
`

const Link = styled.a`
  white-space: nowrap;
  > [data-sanity-icon] {
    ${getVarName(vars.color.muted.fg)}: ${vars.color.link.fg};
  }
`

function LinkComponent(props: {children?: React.ReactNode}) {
  return (
    <Link href={FEEDBACK_FORM_LINK} target="_blank" rel="noreferrer">
      <Span>{props.children}</Span> <LaunchIcon />
    </Link>
  )
}

export function TasksListFeedbackFooter() {
  const {t} = useTranslation(tasksLocaleNamespace)
  return (
    <Box padding={4}>
      <Text muted size={1}>
        <Translate i18nKey="list.feedback.text" t={t} components={{Link: LinkComponent}} />
      </Text>
    </Box>
  )
}
