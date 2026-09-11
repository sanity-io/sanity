import {
  Badge,
  Box,
  Button,
  Card,
  Checkbox,
  Dialog,
  Select,
  Stack,
  Text,
  TextInput,
} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {Flex} from 'ui5'

import {compareUrl} from '../trends/links'
import {AuthorAvatar} from './AuthorAvatar'
import {type BisectCommit, buildChain, chainErrorCopy} from './bisect'
import {filterCommits, type GitCommitSlice, type TagSlice} from './data'
import {RelativeDate} from './RelativeDate'
import {type NewSessionInput} from './sessions'
import {pluralize} from './text'

interface Endpoint {
  sha: string
  label?: string
}

function shortLabel(endpoint: Endpoint): string {
  return endpoint.label ?? endpoint.sha.slice(0, 7)
}

/**
 * Endpoint picking for a new session: a release tag as a one-click shortcut,
 * or a commit found by sha prefix / subject search. Creation is gated on a
 * client-side chain pre-check so a doomed session (swapped endpoints,
 * off-mainline pick) is blocked with an explanation instead of created.
 */
export function NewSessionDialog(props: {
  commits: GitCommitSlice[]
  tags: TagSlice[]
  commitsBySha: Map<string, BisectCommit>
  createdBy: string
  onClose: () => void
  /** Must settle (the tool toasts failures) — the submit stays disabled until it does. */
  onCreate: (input: NewSessionInput) => Promise<unknown>
}) {
  const {commits, tags, commitsBySha, createdBy, onClose, onCreate} = props
  const [good, setGood] = useState<Endpoint | null>(null)
  const [bad, setBad] = useState<Endpoint | null>(null)
  const [releasesOnly, setReleasesOnly] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const chainCheck = useMemo(() => {
    if (!good || !bad) return null
    return buildChain(commitsBySha, good.sha, bad.sha)
  }, [commitsBySha, good, bad])

  // A not-ancestor pair whose REVERSE chain works means the endpoints are
  // simply swapped — say so precisely and offer the one-click fix
  const isSwapped = useMemo(() => {
    if (!good || !bad || chainCheck?.ok !== false || chainCheck.reason !== 'not-ancestor') {
      return false
    }
    return buildChain(commitsBySha, bad.sha, good.sha).ok
  }, [commitsBySha, good, bad, chainCheck])

  const blocked = !good || !bad || !chainCheck?.ok

  return (
    <Dialog id="bisect-new-session" header="Start bisect" width={1} onClose={onClose}>
      <Box padding={4}>
        <Stack gap={5}>
          <EndpointPicker
            badge="Bad"
            title="known broken"
            tone="critical"
            commits={commits}
            tags={tags}
            value={bad}
            onChange={setBad}
          />
          <EndpointPicker
            badge="Good"
            title="last known working"
            tone="positive"
            commits={commits}
            tags={tags}
            value={good}
            onChange={setGood}
          />

          {good && bad && isSwapped && (
            <Card padding={3} radius={2} tone="caution">
              <Flex alignItems="center" gap={3}>
                <Box flex={1}>
                  <Text size={1}>
                    Good ({shortLabel(good)}) is newer than bad ({shortLabel(bad)}) — the endpoints
                    look swapped.
                  </Text>
                </Box>
                <Button
                  mode="ghost"
                  fontSize={1}
                  text="Swap endpoints"
                  onClick={() => {
                    setGood(bad)
                    setBad(good)
                  }}
                />
              </Flex>
            </Card>
          )}
          {good && bad && chainCheck && !chainCheck.ok && !isSwapped && (
            <Card padding={3} radius={2} tone="caution">
              <Text size={1}>
                {chainErrorCopy(chainCheck.reason, shortLabel(good), shortLabel(bad))}
              </Text>
            </Card>
          )}
          {good && bad && chainCheck?.ok && (
            <Text size={1} muted>
              {pluralize(chainCheck.chain.length - 2, 'commit')} between good and bad —{' '}
              <a href={compareUrl(good.sha, bad.sha)} target="_blank" rel="noreferrer">
                compare on GitHub
              </a>
            </Text>
          )}

          <Flex alignItems="center" gap={2} as="label">
            <Checkbox
              checked={releasesOnly}
              onChange={(event) => setReleasesOnly(event.currentTarget.checked)}
            />
            <Text size={1}>Bisect released versions only</Text>
          </Flex>

          <Flex gap={2} justifyContent="flex-end">
            <Button mode="ghost" text="Cancel" onClick={onClose} />
            <Button
              tone="primary"
              text={submitting ? 'Starting…' : 'Start bisecting'}
              disabled={blocked || submitting}
              onClick={() => {
                if (!good || !bad || submitting) return
                setSubmitting(true)
                // On success the tool unmounts this dialog; on failure the
                // button re-arms next to the error toast
                void onCreate({good, bad, releasesOnly, createdBy}).finally(() =>
                  setSubmitting(false),
                )
              }}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}

function EndpointPicker(props: {
  badge: string
  title: string
  tone: 'positive' | 'critical'
  commits: GitCommitSlice[]
  tags: TagSlice[]
  value: Endpoint | null
  onChange: (endpoint: Endpoint | null) => void
}) {
  const {badge, title, tone, commits, tags, value, onChange} = props
  const [query, setQuery] = useState('')
  const results = useMemo(() => filterCommits(commits, query, 8), [commits, query])
  const selected = value ? commits.find((commit) => commit.sha === value.sha) : undefined

  return (
    <Stack gap={3}>
      <Flex alignItems="center" gap={2}>
        <Badge tone={tone} fontSize={0}>
          {badge}
        </Badge>
        <Text size={1} weight="medium">
          {title}
        </Text>
      </Flex>

      {value ? (
        <Card padding={3} radius={2} tone={tone} border>
          <Flex alignItems="center" gap={3}>
            <Box flex={1} style={{minWidth: 0}}>
              <Stack gap={2}>
                <Text size={1}>
                  <code>{value.sha.slice(0, 10)}</code>
                  {value.label && value.label !== value.sha.slice(0, 7) ? ` (${value.label})` : ''}
                </Text>
                {selected ? (
                  <>
                    <Text size={1} textOverflow="ellipsis">
                      {selected.subject}
                    </Text>
                    <Flex alignItems="center" gap={2}>
                      <AuthorAvatar
                        name={selected.authorName ?? undefined}
                        email={selected.authorEmail ?? undefined}
                        login={selected.authorLogin ?? undefined}
                        avatarUrl={
                          selected.authorAvatarUrl?.startsWith('https://')
                            ? selected.authorAvatarUrl
                            : undefined
                        }
                      />
                      {selected.authorName && (
                        <Text size={0} muted>
                          {selected.authorName} ·
                        </Text>
                      )}
                      <RelativeDate dateTime={selected.committedAt} size={0} muted />
                    </Flex>
                  </>
                ) : (
                  // A tag can point off-mainline (release-branch cut) — the
                  // chain check below is what decides if it's usable
                  <Text size={0} muted>
                    not on the synced mainline
                  </Text>
                )}
              </Stack>
            </Box>
            <Button mode="bleed" fontSize={1} text="Change" onClick={() => onChange(null)} />
          </Flex>
        </Card>
      ) : (
        <Stack gap={3}>
          <Select
            fontSize={1}
            value=""
            onChange={(event) => {
              const tag = tags.find((candidate) => candidate.tag === event.currentTarget.value)
              if (tag) onChange({sha: tag.sha, label: tag.tag})
            }}
          >
            <option value="">Pick a release tag…</option>
            {tags.map((tag) => (
              <option key={tag._id} value={tag.tag}>
                {tag.tag} ({tag.taggedAt.slice(0, 10)})
              </option>
            ))}
          </Select>
          <TextInput
            fontSize={1}
            placeholder="…or search commits by sha or subject"
            value={query}
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          <Stack gap={1}>
            {results.length === 0 && (
              <Text size={1} muted>
                No commits match “{query.trim()}”.
              </Text>
            )}
            {results.map((commit) => (
              <Card
                key={commit._id}
                as="button"
                padding={2}
                radius={2}
                onClick={() => onChange({sha: commit.sha})}
                style={{textAlign: 'left'}}
              >
                <Flex alignItems="center" gap={2}>
                  <Box style={{flexShrink: 0}}>
                    <Badge fontSize={0}>{commit.sha.slice(0, 7)}</Badge>
                  </Box>
                  {/* flex + minWidth 0 so the ellipsis truncates the subject
                      instead of letting it overlap its siblings */}
                  <Box flex={1} style={{minWidth: 0}}>
                    <Text size={1} textOverflow="ellipsis">
                      {commit.subject}
                    </Text>
                  </Box>
                  {!commit.testStudioUrl && (
                    <Box style={{flexShrink: 0}}>
                      <Text size={0} muted>
                        no preview build
                      </Text>
                    </Box>
                  )}
                  <Box style={{flexShrink: 0}}>
                    <RelativeDate dateTime={commit.committedAt} size={0} muted />
                  </Box>
                </Flex>
              </Card>
            ))}
          </Stack>
        </Stack>
      )}
    </Stack>
  )
}
