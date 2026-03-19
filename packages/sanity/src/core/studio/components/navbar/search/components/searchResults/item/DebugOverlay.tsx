/* eslint-disable i18next/no-literal-string */
import {Card, type CardTone, Code, Inline, Stack} from '@sanity/ui'

import {Tooltip} from '../../../../../../../../ui-components'
import {type WeightedHit} from '../../../../../../../search'

interface DebugScoreProps {
  data: WeightedHit
}

import {debugScoreCard} from './DebugOverlay.css'

export function DebugOverlay({data}: DebugScoreProps) {
  const {score} = data

  let tone: CardTone = 'default'
  if (score <= 0.1) {
    tone = 'critical'
  } else if (score >= 0.5) {
    tone = 'primary'
  }

  const matchingStories = data.stories.filter((story) => story.score > 0)

  return (
    <>
      <Tooltip
        content={
          <Stack space={2}>
            {matchingStories.length ? (
              <>
                {matchingStories.map((story) => (
                  <Inline key={story.path} space={3}>
                    <Code size={0} weight="medium">
                      {story.path}
                    </Code>
                    <Code size={0}>{story.why}</Code>
                  </Inline>
                ))}
              </>
            ) : (
              <Code size={0}>No matches</Code>
            )}
          </Stack>
        }
        placement="bottom-start"
        portal
      >
        <Card className={debugScoreCard} padding={1} shadow={1} tone={tone}>
          <Code size={0}>score: {score}</Code>
        </Card>
      </Tooltip>
    </>
  )
}
