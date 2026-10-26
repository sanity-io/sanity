import {PlugIcon} from '@sanity/icons/Plug'
import {Box, Button, Card, Switch} from '@sanity/ui'
import {Popover} from '@sanity/ui/popover'
import {type ReactNode, useEffect, useRef, useState, useSyncExternalStore} from 'react'
import {useClient} from 'sanity'
import {Flex, Text, VStack} from 'ui5'

import {
  checkCorsNow,
  clearLog,
  type CorsCheckResult,
  dropLiveConnections,
  getSnapshot,
  isAccepted,
  type LogEntry,
  type LogTone,
  MANAGED_ORIGIN_BODY,
  setSimulateManagedOrigin,
  subscribe,
} from './interceptor'

// The version the Presentation tool's live events client uses
const API_VERSION = '2025-02-19'

const MONOSPACE = {fontFamily: 'monospace', overflowWrap: 'anywhere'} as const

export function CorsCheckButton() {
  const [open, setOpen] = useState(false)
  const {simulateManagedOrigin} = useSyncExternalStore(subscribe, getSnapshot)

  return (
    <Popover constrainSize content={<CorsCheckPanel />} open={open} placement="bottom-end" portal>
      <Button
        data-testid="cors-check-debug-button"
        fontSize={1}
        icon={PlugIcon}
        mode="bleed"
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        padding={2}
        selected={open}
        text="CORS"
        tone={simulateManagedOrigin ? 'caution' : 'default'}
      />
    </Popover>
  )
}

function CorsCheckPanel() {
  const client = useClient({apiVersion: API_VERSION})
  const {simulateManagedOrigin, liveConnections, log} = useSyncExternalStore(subscribe, getSnapshot)
  const [result, setResult] = useState<CorsCheckResult | null>(null)
  const [checking, setChecking] = useState(false)

  async function handleCheck() {
    setChecking(true)
    setResult(await checkCorsNow(client))
    setChecking(false)
  }

  return (
    <Box data-testid="cors-check-debug-panel" padding={3} style={{width: 460}}>
      <VStack gap={4}>
        <VStack gap={2}>
          <Text size={1} weight="semibold">
            Live Content API CORS
          </Text>
          <Text muted size={1}>
            Origin {location.origin}, project {client.config().projectId}
          </Text>
        </VStack>

        <Section title="Ask the API">
          <Button
            fontSize={1}
            loading={checking}
            onClick={() => void handleCheck()}
            text="Call /check/cors"
            tone="primary"
          />
          {result && <CheckResult result={result} />}
        </Section>

        <Section title="Simulate a managed origin">
          <Flex alignItems="flex-start" as="label" gap={3}>
            <Switch
              checked={simulateManagedOrigin}
              data-testid="cors-check-debug-simulate"
              onChange={(event) => setSimulateManagedOrigin(event.currentTarget.checked)}
            />
            <Text size={1}>
              Every /check/cors request in this tab gets{' '}
              <span style={MONOSPACE}>{MANAGED_ORIGIN_BODY}</span>, the answer a *.sanity.studio
              host without a manual CORS entry gets today
            </Text>
          </Flex>
        </Section>

        <Section title="Simulate sleep/wake">
          <Button
            disabled={liveConnections === 0}
            fontSize={1}
            mode="ghost"
            onClick={dropLiveConnections}
            text={`Drop ${liveConnections} live connection${liveConnections === 1 ? '' : 's'}`}
            tone="caution"
          />
          <Text muted size={1}>
            {liveConnections === 0
              ? 'Open the Presentation tool to start one.'
              : '@sanity/client calls /check/cors before it reconnects.'}
          </Text>
        </Section>

        <Section
          action={<Button fontSize={1} mode="bleed" onClick={clearLog} padding={1} text="Clear" />}
          title="Log"
        >
          <LogView entries={log} />
        </Section>
      </VStack>
    </Box>
  )
}

function CheckResult(props: {result: CorsCheckResult}) {
  const {checkCors, credentialedRequest} = props.result
  const accepted = checkCors.ok && isAccepted(checkCors.value.verdict)

  let conclusion = 'A dropped stream reconnects.'
  if (!accepted) {
    conclusion = credentialedRequest.ok
      ? 'The next dropped stream throws CorsOriginError, although the API accepts this origin with credentials.'
      : 'The next dropped stream throws CorsOriginError.'
  }

  return (
    <VStack gap={2}>
      <ResultRow
        label="/check/cors"
        tone={accepted ? 'positive' : 'critical'}
        value={checkCors.ok ? checkCors.value.body : checkCors.error}
      />
      <ResultRow
        label="GET /users/me with credentials"
        tone={credentialedRequest.ok ? 'positive' : 'critical'}
        value={
          credentialedRequest.ok
            ? `HTTP ${credentialedRequest.value.status}, CORS accepted the origin`
            : `${credentialedRequest.error}, blocked by CORS`
        }
      />
      <Text size={1} weight="semibold">
        {conclusion}
      </Text>
    </VStack>
  )
}

function ResultRow(props: {label: string; tone: LogTone; value: string}) {
  return (
    <Card border padding={2} radius={2} tone={props.tone}>
      <VStack gap={2}>
        <Text muted size={0}>
          {props.label}
        </Text>
        <Text size={1} style={MONOSPACE}>
          {props.value}
        </Text>
      </VStack>
    </Card>
  )
}

function LogView(props: {entries: readonly LogEntry[]}) {
  const {entries} = props
  const scrollRef = useRef<HTMLDivElement>(null)
  const lastEntryId = entries.at(-1)?.id

  useEffect(() => {
    if (lastEntryId === undefined) return
    scrollRef.current?.scrollTo({top: scrollRef.current.scrollHeight})
  }, [lastEntryId])

  return (
    <Card border radius={2} tone="transparent">
      <div
        data-testid="cors-check-debug-log"
        ref={scrollRef}
        style={{maxHeight: 260, overflowY: 'auto', padding: 8}}
      >
        {entries.length === 0 ? (
          <Text muted size={0}>
            Nothing yet
          </Text>
        ) : (
          <VStack gap={2}>
            {entries.map((entry) => (
              <Text key={entry.id} size={0} style={MONOSPACE} tone={entry.tone}>
                <Text as="span" muted size={0}>
                  {formatTime(entry.time)}
                </Text>{' '}
                {entry.text}
              </Text>
            ))}
          </VStack>
        )}
      </div>
    </Card>
  )
}

function Section(props: {action?: ReactNode; children: ReactNode; title: string}) {
  return (
    <VStack gap={2}>
      <Flex alignItems="center" justifyContent="space-between">
        <Text muted size={0} weight="semibold">
          {props.title}
        </Text>
        {props.action}
      </Flex>
      {props.children}
    </VStack>
  )
}

function formatTime(time: number): string {
  const date = new Date(time)
  const milliseconds = String(date.getMilliseconds()).padStart(3, '0')
  return `${date.toLocaleTimeString('en-GB', {hour12: false})}.${milliseconds}`
}
