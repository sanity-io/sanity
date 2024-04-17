import {LaunchIcon} from '@sanity/icons'
import {Card, Text} from '@sanity/ui'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {commentsLocaleNamespace} from '../../i18n'

const FEEDBACK_FORM_LINK = 'https://snty.link/comments-beta-feedback'

const Span = styled.span`
  margin-right: 0.2em;
`

const Link = styled.a`
  white-space: nowrap;
`

const FooterCard = styled(Card)({
  position: 'relative',
  zIndex: 1,
})

export function CommentsInspectorFeedbackFooter() {
  const {t} = useTranslation(commentsLocaleNamespace)
  return (
    <FooterCard padding={4}>
      <Text muted size={1}>
        {t('feature-feedback.title')}{' '}
        <Link href={FEEDBACK_FORM_LINK} target="_blank" rel="noreferrer">
          <Span>{t('feature-feedback.link')} </Span> <LaunchIcon />
        </Link>
      </Text>
    </FooterCard>
  )
}
