import {LaunchIcon} from '@sanity/icons'
import {Box, Text} from '@sanity/ui'
import {useTranslation} from 'sanity'
import {styled} from 'styled-components'

import {tasksLocaleNamespace} from '../../../../i18n'

const FEEDBACK_FORM_LINK = 'https://snty.link/tasks-feedback'

const Span = styled.span`
  margin-right: 0.2em;
`

const Link = styled.a`
  white-space: nowrap;
  > [data-sanity-icon] {
    --card-icon-color: var(--card-link-color);
  }
`

export function TasksListFeedbackFooter() {
  const {t} = useTranslation(tasksLocaleNamespace)
  return (
    <Box padding={4}>
      <Text muted size={1}>
        {t('list.feedback.text')}{' '}
        <Link href={FEEDBACK_FORM_LINK} target="_blank" rel="noreferrer">
          <Span>{t('list.feedback.link')} </Span> <LaunchIcon />
        </Link>
      </Text>
    </Box>
  )
}
