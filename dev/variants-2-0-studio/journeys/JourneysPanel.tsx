import {CloseIcon} from '@sanity/icons/Close'
import {Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {useState} from 'react'
import {useRouter} from 'sanity/router'

import {applyPreset} from '../design-options/store'
import journeysData from '../options/journeys.json'

// The Journeys panel: a sibling of the Design options window. It lists the Open beta journeys (journeys.json, copied from
// docs/initiatives/curation-perspective-selector/), applies a journey's preset, routes to the first step, and shows a
// step checklist with the expected state. Checked steps are remembered in this browser.

interface Step {
  title: string
  component?: string
  option?: string
  preset?: string
  route?: string
  expect?: string
  story?: string
}

interface Journey {
  id: string
  task: string
  title: string
  stage: string
  persona: string
  components: string[]
  steps: Step[]
}

const JOURNEYS = journeysData as Journey[]
const CHECKS_KEY = 'variants-2-0-studio:journey-checks'
const STORYBOOK_BASE = 'https://sanity-studio-storybook-r4ildcrzv.sanity.dev'

function loadChecks(): Record<string, boolean> {
  try {
    return JSON.parse(window.localStorage.getItem(CHECKS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function JourneyRow({journey, open, onToggle}: {journey: Journey; open: boolean; onToggle: () => void}) {
  const router = useRouter()
  const [checks, setChecks] = useState<Record<string, boolean>>(loadChecks)
  const key = (index: number) => `${journey.id}:${index}`
  const done = journey.steps.filter((_, i) => checks[key(i)]).length

  const toggle = (index: number) => {
    const next = {...checks, [key(index)]: !checks[key(index)]}
    setChecks(next)
    try {
      window.localStorage.setItem(CHECKS_KEY, JSON.stringify(next))
    } catch {
      // Not remembered this time.
    }
  }
  const go = (step?: Step) => {
    applyPreset(step?.preset ?? journey.id)
    if (step?.route) router.navigateUrl({path: step.route})
  }

  return (
    <Stack gap={1}>
      <Card as="button" onClick={onToggle} padding={2} radius={2} selected={open} style={{cursor: 'pointer', textAlign: 'left', width: '100%'}}>
        <Flex align="center" gap={2}>
          <Text muted={!open} size={0}>
            {journey.id.toUpperCase()}
          </Text>
          <Box flex={1}>
            <Text size={1} textOverflow="ellipsis">
              {journey.title}
            </Text>
          </Box>
          {journey.steps.length ? (
            <Text muted size={0}>
              {done}/{journey.steps.length}
            </Text>
          ) : null}
        </Flex>
      </Card>
      {open ? (
        <Stack data-testid={`journey-${journey.id}`} gap={3} paddingBottom={2} paddingLeft={2}>
          <Text muted size={0}>
            {journey.task} · {journey.persona} · {journey.stage}
            {journey.components.length ? ` · ${journey.components.join(', ')}` : ''}
          </Text>
          <Flex gap={2}>
            <Button fontSize={1} onClick={() => go(journey.steps[0])} padding={2} style={{height: 25}} text="Start journey" tone="primary" />
          </Flex>
          {journey.steps.length === 0 ? (
            <Text muted size={0}>
              No steps in journeys.json yet. Start applies the journey's preset (all A, open beta); open the options window to change it.
            </Text>
          ) : (
            <Stack gap={2}>
              {journey.steps.map((step, i) => (
                <Flex align="flex-start" gap={2} key={key(i)}>
                  <input
                    aria-label={`Step ${i + 1} done`}
                    checked={!!checks[key(i)]}
                    onChange={() => toggle(i)}
                    style={{cursor: 'pointer', marginTop: 4}}
                    type="checkbox"
                  />
                  <Stack flex={1} gap={1}>
                    <Text size={1}>
                      {i + 1}. {step.title}
                      {step.component ? ` · ${step.component}${step.option ? ` ${step.option}` : ''}` : ''}
                    </Text>
                    {step.expect ? (
                      <Text muted size={0}>
                        Expect: {step.expect}
                      </Text>
                    ) : null}
                    <Flex gap={2}>
                      <Button fontSize={0} mode="bleed" onClick={() => go(step)} padding={1} text="Go" />
                      {step.story ? (
                        <a href={`${STORYBOOK_BASE}/?path=/story/${step.story}`} rel="noreferrer" style={{fontSize: 12}} target="_blank">
                          Storybook
                        </a>
                      ) : null}
                    </Flex>
                  </Stack>
                </Flex>
              ))}
            </Stack>
          )}
        </Stack>
      ) : null}
    </Stack>
  )
}

/** The collapsed control (next to Design options) and the panel above it. */
export function JourneysPanel() {
  const [open, setOpen] = useState(false)
  const [openJourney, setOpenJourney] = useState<string | null>(null)
  const tasks = Array.from(new Set(JOURNEYS.map((j) => j.task))).sort()

  return (
    <div style={{bottom: 16, left: 270, position: 'fixed', zIndex: 1000000}}>
      {open ? (
        <Card
          border
          onKeyDown={(event) => {
            if (event.key === 'Escape') setOpen(false)
          }}
          radius={3}
          shadow={3}
          style={{bottom: 33, display: 'flex', flexDirection: 'column', left: 0, maxHeight: 560, position: 'absolute', width: 420}}
        >
          <Flex align="center" gap={2} padding={2}>
            <Stack flex={1} gap={1}>
              <Text size={1} weight="medium">
                Journeys
              </Text>
              <Text muted size={0}>
                {JOURNEYS.length} Open beta journeys. Start applies the preset and routes to the first step.
              </Text>
            </Stack>
            <Button aria-label="Close" icon={CloseIcon} mode="bleed" onClick={() => setOpen(false)} padding={2} style={{height: 25, width: 25}} />
          </Flex>
          <Box padding={2} style={{borderTop: '1px solid var(--card-border-color)', overflow: 'auto'}}>
            <Stack gap={3}>
              {tasks.map((task) => (
                <Stack gap={1} key={task}>
                  <Box paddingX={2}>
                    <Text muted size={0} style={{letterSpacing: '0.04em', textTransform: 'uppercase'}} weight="medium">
                      {task}
                    </Text>
                  </Box>
                  {JOURNEYS.filter((j) => j.task === task).map((journey) => (
                    <JourneyRow journey={journey} key={journey.id} onToggle={() => setOpenJourney(openJourney === journey.id ? null : journey.id)} open={openJourney === journey.id} />
                  ))}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Card>
      ) : null}
      <Card radius={2} shadow={2}>
        <Button aria-expanded={open} fontSize={1} mode="bleed" onClick={() => setOpen((v) => !v)} padding={2} style={{height: 25}} text="Journeys" />
      </Card>
    </div>
  )
}
