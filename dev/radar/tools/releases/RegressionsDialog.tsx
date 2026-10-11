import {CloseIcon} from '@sanity/icons/Close'
import {LaunchIcon} from '@sanity/icons/Launch'
import {Badge, Box, Button, Card, Dialog, Select, Text} from '@sanity/ui'
import {useToast} from '@sanity/ui/toast'
import {useMemo, useState} from 'react'
import {type SanityClient} from 'sanity'
import {useLink} from 'sanity/router'
import {Flex, VStack} from 'ui5'

import {type SessionSummary, type TagSlice} from '../bisect/data'
import {RelativeDate} from '../bisect/RelativeDate'
import {deleteSessions, updateResults} from '../bisect/sessions'
import {isSeverity, SEVERITIES, SEVERITY_LABEL, SEVERITY_TONE} from '../bisect/severity'
import {pluralize} from '../bisect/text'
import {bisectSessionPath, compareTagsSemverDesc, type ReleaseRegressions} from './releaseInfo'

/** A confirmed regression with the release that gets the blame for it. */
export interface ReleaseRegression {
  /** The session holding the verdict, carrying the chain's merged annotations. */
  session: SessionSummary
  /** Tag name of the release that first shipped the culprit. */
  introducedIn: string
  /**
   * Every session under the chain's root, abandoned branches included —
   * removing the regression removes them all, and the chain-level fields
   * (severity, fix release) are written to all of them, since what the row
   * shows is the union of the chain and a change must hold everywhere.
   */
  chainIds: string[]
}

/**
 * The regressions one release has a say in — each is a bisectSession (a real
 * bisect that converged inside a release, or a hand-added report), grouped
 * by what this release did with it: introduced it (the blame), inherited it
 * from an earlier release without a fix yet, or fixed it. Lists what broke,
 * who recorded it and when, links into the Bisect tool for the full record,
 * and removes an entry outright: the session IS the regression, so unpinning
 * means deleting it, the same hard delete the session view offers. Two-step
 * inline confirm rather than a nested dialog.
 */
export function RegressionsDialog(props: {
  tag: string
  /** Absent once the last regression touching `tag` is removed. */
  regressions: ReleaseRegressions<ReleaseRegression> | undefined
  /** Every synced release — the "fixed in" candidates are the ones newer than the introducing release. */
  tags: TagSlice[]
  client: SanityClient
  onClose: () => void
}) {
  const {tag, regressions, tags, client, onClose} = props
  const introduced = regressions?.introduced ?? []
  const inherited = regressions?.inherited ?? []
  const fixed = regressions?.fixed ?? []
  const total = introduced.length + inherited.length + fixed.length
  const section = (title: string, hint: string, entries: ReleaseRegression[]) =>
    entries.length > 0 && (
      <VStack gap={3}>
        <VStack gap={2}>
          <Text size={1} weight="semibold">
            {title}
          </Text>
          <Text size={0} muted>
            {hint}
          </Text>
        </VStack>
        {entries.map((entry) => (
          <RegressionRow
            key={entry.session._id}
            entry={entry}
            introducedHere={entry.introducedIn === tag}
            tags={tags}
            client={client}
          />
        ))}
      </VStack>
    )
  return (
    <Dialog
      id="releases-regressions"
      header={`${pluralize(total, 'regression')} in ${tag}`}
      width={1}
      onClose={onClose}
    >
      <Box padding={4}>
        <VStack gap={5}>
          {total === 0 && (
            <Text size={1} muted>
              No regressions touch {tag} any more.
            </Text>
          )}
          {section(
            `Introduced in ${tag}`,
            'This release first shipped the offending commit.',
            introduced,
          )}
          {section(
            'Inherited from earlier releases',
            `Introduced before ${tag} and not fixed yet when it shipped — the blame stays on the introducing release.`,
            inherited,
          )}
          {section(`Fixed in ${tag}`, 'Marked as fixed in this release.', fixed)}
        </VStack>
      </Box>
    </Dialog>
  )
}

function RegressionRow(props: {
  entry: ReleaseRegression
  /** False for inherited and fixed entries, which name their introducing release. */
  introducedHere: boolean
  tags: TagSlice[]
  client: SanityClient
}) {
  const {entry, introducedHere, tags, client} = props
  const {session, introducedIn, chainIds} = entry
  // A fix can only ship after the release that introduced the regression —
  // the introducing one, not the release this dialog is open for
  const fixCandidates = useMemo(
    () =>
      tags
        .filter((candidate) => compareTagsSemverDesc(candidate.tag, introducedIn) < 0)
        .toSorted((a, b) => compareTagsSemverDesc(a.tag, b.tag)),
    [tags, introducedIn],
  )
  const toast = useToast()
  const [confirming, setConfirming] = useState(false)
  const [removing, setRemoving] = useState(false)

  // See bisectSessionPath: the tool router is scoped, so the sibling tool's
  // URL comes from the current location instead
  const sessionHref = bisectSessionPath(window.location.pathname, session._id)
  // Same modifier/middle-click handling as every other studio link
  const sessionLink = useLink({href: sessionHref})

  const fixedIn = session.result?.fixedIn ?? ''
  const severity = isSeverity(session.result?.severity) ? session.result.severity : ''
  const setSeverity = (next: string) => {
    updateResults(client, chainIds, {severity: isSeverity(next) ? next : ''}).catch(
      (err: unknown) =>
        toast.push({
          status: 'error',
          title: 'Could not save the severity',
          description: err instanceof Error ? err.message : String(err),
        }),
    )
  }
  // A stored value that isn't (or is no longer) a synced newer release still
  // has to be selectable, or the select would silently show "Not fixed yet"
  const fixedInIsKnown = fixCandidates.some((candidate) => candidate.tag === fixedIn)
  // No "unchanged" short-circuit: it would compare against the last echoed
  // value, so a quick A → B → A would skip the write back to A. The change
  // event only fires for real changes, and a redundant set/unset is harmless
  const setFixedIn = (next: string) => {
    updateResults(client, chainIds, {fixedIn: next}).catch((err: unknown) =>
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
    // failure the confirm stays open next to the toast so it can be retried.
    // The whole chain goes: deleting only the refinement would resurface
    // its parent as the same regression, one step less precise
    deleteSessions(client, chainIds).catch((err: unknown) => {
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
      {/* What it is on top, full width (descriptions often carry a long
          Slack or Linear URL — let it break anywhere rather than run under
          the controls); the controls on a line of their own below */}
      <VStack gap={3}>
        <Box>
          <VStack gap={2}>
            <Flex alignItems="center" gap={2} flexWrap="wrap">
              <Text size={1} weight="medium" style={{overflowWrap: 'anywhere'}}>
                {session.description || session.title || session._id}
              </Text>
              {isSeverity(session.result?.severity) && (
                <Badge tone={SEVERITY_TONE[session.result.severity]} fontSize={0}>
                  {SEVERITY_LABEL[session.result.severity]}
                </Badge>
              )}
              {chainIds.length > 1 && (
                <Badge tone="default" fontSize={0}>
                  {pluralize(chainIds.length, 'linked session')}
                </Badge>
              )}
              {!introducedHere && (
                <Badge tone="critical" fontSize={0}>
                  introduced in {introducedIn}
                </Badge>
              )}
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
            {session.result?.note && (
              <Text size={1} muted style={{overflowWrap: 'anywhere'}}>
                {session.result.note}
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
                <a href={sessionHref} onClick={sessionLink.onClick}>
                  Open in Bisect <LaunchIcon />
                </a>
              </Text>
            </Flex>
          </VStack>
        </Box>
        <Flex alignItems="center" gap={2} justifyContent="flex-end" flexWrap="wrap">
          <Box style={{flexShrink: 0}}>
            <Select
              fontSize={1}
              padding={2}
              value={severity}
              aria-label="Severity"
              onChange={(event) => setSeverity(event.currentTarget.value)}
            >
              <option value="">Not rated</option>
              {SEVERITIES.map((step) => (
                <option key={step} value={step}>
                  {SEVERITY_LABEL[step]}
                </option>
              ))}
            </Select>
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
              aria-label={
                chainIds.length > 1
                  ? `Remove this regression and its ${pluralize(chainIds.length, 'linked session')}`
                  : 'Remove this regression'
              }
              title={
                chainIds.length > 1
                  ? `Remove this regression (deletes its ${pluralize(chainIds.length, 'linked session')})`
                  : 'Remove this regression'
              }
              onClick={() => setConfirming(true)}
            />
          )}
        </Flex>
      </VStack>
    </Card>
  )
}
