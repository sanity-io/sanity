import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Card, Dialog, Select, Stack, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useMemo, useState} from 'react'
import {type SanityClient} from 'sanity'
import {useRouter} from 'sanity/router'
import {Flex} from 'ui5'

import {type SessionSummary, type TagSlice} from '../bisect/data'
import {RelativeDate} from '../bisect/RelativeDate'
import {deleteSession, updateResult} from '../bisect/sessions'
import {pluralize} from '../bisect/text'
import {bisectSessionPath, compareTagsSemverDesc} from './releaseInfo'

/**
 * The regressions pinned on one release — each is a bisectSession (a real
 * bisect that converged inside this release, or a hand-added report). Lists
 * what broke, who recorded it and when, links into the Bisect tool for the
 * full record, and removes an entry outright: the session IS the regression,
 * so unpinning means deleting it, the same hard delete the session view
 * offers. Two-step inline confirm rather than a nested dialog.
 */
export function RegressionsDialog(props: {
  tag: string
  regressions: SessionSummary[]
  /** Every synced release — the "fixed in" candidates are the ones newer than `tag`. */
  tags: TagSlice[]
  client: SanityClient
  onClose: () => void
}) {
  const {tag, regressions, tags, client, onClose} = props
  // A fix can only ship after the release that introduced the regression
  const fixCandidates = useMemo(
    () =>
      tags
        .filter((candidate) => compareTagsSemverDesc(candidate.tag, tag) < 0)
        .toSorted((a, b) => compareTagsSemverDesc(a.tag, b.tag)),
    [tags, tag],
  )
  return (
    <Dialog
      id="releases-regressions"
      header={`${pluralize(regressions.length, 'regression')} in ${tag}`}
      width={1}
      onClose={onClose}
    >
      <Box padding={4}>
        <Stack gap={3}>
          {regressions.length === 0 && (
            <Text size={1} muted>
              No regressions are pinned on {tag} any more.
            </Text>
          )}
          {regressions.map((session) => (
            <RegressionRow
              key={session._id}
              session={session}
              fixCandidates={fixCandidates}
              client={client}
            />
          ))}
        </Stack>
      </Box>
    </Dialog>
  )
}

function RegressionRow(props: {
  session: SessionSummary
  fixCandidates: TagSlice[]
  client: SanityClient
}) {
  const {session, fixCandidates, client} = props
  const toast = useToast()
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)

  // See bisectSessionPath: the tool router is scoped, so the sibling tool's
  // URL comes from the current location instead
  const sessionHref = bisectSessionPath(window.location.pathname, session._id)

  const fixedIn = session.result?.fixedIn ?? ''
  // A stored value that isn't (or is no longer) a synced newer release still
  // has to be selectable, or the select would silently show "Not fixed yet"
  const fixedInIsKnown = fixCandidates.some((candidate) => candidate.tag === fixedIn)
  const setFixedIn = (next: string) => {
    if (next === fixedIn) return
    updateResult(client, session._id, {fixedIn: next}).catch((err: unknown) =>
      toast.push({
        status: 'error',
        title: 'Could not save where it was fixed',
        description: err instanceof Error ? err.message : String(err),
      }),
    )
  }

  const remove = () => {
    setRemoving(true)
    // The realtime sessions query drops the row once the delete lands; on
    // failure the confirm stays open next to the toast so it can be retried
    deleteSession(client, session._id).catch((err: unknown) => {
      setRemoving(false)
      toast.push({
        status: 'error',
        title: 'Could not remove the regression',
        description: err instanceof Error ? err.message : String(err),
      })
    })
  }

  return (
    <Card padding={3} radius={2} border tone={confirming ? 'critical' : 'default'}>
      <Flex alignItems="flex-start" gap={3}>
        <Box flex={1} style={{minWidth: 0}}>
          <Stack gap={2}>
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <Text size={1} weight="medium">
                {session.result?.description || session.title || session._id}
              </Text>
              {fixedIn && (
                <Badge tone="positive" fontSize={0}>
                  fixed in {fixedIn}
                </Badge>
              )}
            </Flex>
            {session.resultSubject && (
              <Text size={1} muted textOverflow="ellipsis">
                {session.result?.firstBadSha?.slice(0, 7)} {session.resultSubject}
              </Text>
            )}
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              {session.result?.linearIssue && (
                <Text size={0} muted>
                  {session.result.linearIssue} ·
                </Text>
              )}
              {session.createdBy && (
                <Text size={0} muted>
                  {session.createdBy} ·
                </Text>
              )}
              {session.createdAt && <RelativeDate dateTime={session.createdAt} size={0} muted />}
              <Text size={0} muted>
                ·
              </Text>
              <Text size={0}>
                <a
                  href={sessionHref}
                  onClick={(event) => {
                    if (event.metaKey || event.ctrlKey || event.button !== 0) return
                    event.preventDefault()
                    router.navigateUrl({path: sessionHref})
                  }}
                >
                  Open in Bisect <LaunchIcon />
                </a>
              </Text>
            </Flex>
          </Stack>
        </Box>
        <Box style={{flexShrink: 0}}>
          <Select
            fontSize={1}
            padding={2}
            value={fixedIn}
            aria-label="Fixed in release"
            onChange={(event) => setFixedIn(event.currentTarget.value)}
          >
            <option value="">Not fixed yet</option>
            {fixedIn && !fixedInIsKnown && <option value={fixedIn}>Fixed in {fixedIn}</option>}
            {fixCandidates.map((candidate) => (
              <option key={candidate._id} value={candidate.tag}>
                Fixed in {candidate.tag}
              </option>
            ))}
          </Select>
        </Box>
        {confirming ? (
          <Flex gap={2} style={{flexShrink: 0}}>
            <Button
              mode="ghost"
              fontSize={1}
              text="Cancel"
              disabled={removing}
              onClick={() => setConfirming(false)}
            />
            <Button
              tone="critical"
              fontSize={1}
              text={removing ? 'Removing…' : 'Remove'}
              disabled={removing}
              onClick={remove}
            />
          </Flex>
        ) : (
          <Button
            mode="bleed"
            tone="critical"
            fontSize={1}
            padding={2}
            icon={CloseIcon}
            aria-label="Remove this regression"
            title="Remove this regression"
            onClick={() => setConfirming(true)}
          />
        )}
      </Flex>
    </Card>
  )
}
