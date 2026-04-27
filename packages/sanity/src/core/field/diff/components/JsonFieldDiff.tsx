import {Card, Code, Stack, Text} from '@sanity/ui'
import {type CSSProperties} from 'react'
import {styled} from 'styled-components'

import {useTranslation} from '../../../i18n'
import {type DiffComponent} from '../../types'
import {useChangeVerb} from '../hooks/useChangeVerb'
import {DiffCard} from './DiffCard'
import {DiffTooltip} from './DiffTooltip'
import {FromToArrow} from './FromToArrow'

/**
 * Horizontal scroll only. Avoid `overflow-x: auto` on `pre`: CSS pairs it with
 * `overflow-y: auto`, which spuriously shows a vertical scrollbar in flex layouts.
 */
const CodeWrapper = styled.div`
  max-width: 100%;
  min-width: 0;
  overflow-x: auto;
  overflow-y: hidden;
`

const cardStyles: CSSProperties = {
  flex: 1,
  minWidth: 0,
  display: 'block',
  whiteSpace: 'break-spaces',
}

function jsonify(value: unknown): string {
  if (typeof value === 'undefined') {
    return 'undefined'
  }
  return JSON.stringify(value, null, 2)
}

/** @internal */
export const JsonFieldDiff: DiffComponent = ({diff}) => {
  const {t} = useTranslation()
  const changeVerb = useChangeVerb(diff)

  const from = diff.fromValue !== undefined && diff.fromValue !== null && (
    <DiffCard as="del" diff={diff} style={cardStyles}>
      <CodeWrapper>
        <Code language="json" size={1}>
          {jsonify(diff.fromValue)}
        </Code>
      </CodeWrapper>
    </DiffCard>
  )

  const to = diff.toValue !== undefined && diff.toValue !== null && (
    <DiffCard as="ins" diff={diff} style={cardStyles}>
      <CodeWrapper>
        <Code language="json" size={1}>
          {jsonify(diff.toValue)}
        </Code>
      </CodeWrapper>
    </DiffCard>
  )

  const content =
    from && to ? (
      <DiffTooltip description={changeVerb} diff={diff}>
        <Stack space={3}>
          {from}
          <FromToArrow direction="down" align="center" />
          {to}
        </Stack>
      </DiffTooltip>
    ) : from ? (
      <DiffTooltip description={changeVerb} diff={diff}>
        {from}
      </DiffTooltip>
    ) : to ? (
      <DiffTooltip description={changeVerb} diff={diff}>
        {to}
      </DiffTooltip>
    ) : null

  return (
    <Stack space={4} paddingY={1}>
      <Card border padding={3} radius={2} tone="caution">
        <Text size={1}>{t('changes.unknown-schema-field.description')}</Text>
      </Card>
      {content}
    </Stack>
  )
}
