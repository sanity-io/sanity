import {Box, Button, Card, Dialog, Select, Text, TextArea, TextInput} from '@sanity/ui'
import {useMemo, useState} from 'react'
import {Flex, VStack} from 'ui5'

import {type BisectCommit, buildChain} from '../bisect/bisect'
import {type TagSlice} from '../bisect/data'
import {type ManualRegressionInput} from '../bisect/sessions'
import {isSeverity, SEVERITIES, SEVERITY_LABEL} from '../bisect/severity'
import {pluralize} from '../bisect/text'
import {baseTagOf, compareTagsSemverDesc} from './releaseInfo'

/**
 * Report a regression by hand when the introducing release is already known
 * (a user report, a support ticket) and no bisect was run. The record is a
 * bisectSession converged from birth — see reportRegression in
 * tools/bisect/sessions.ts — so creation needs the same ingredients a
 * releases-only bisect would end with: the blamed release, its base release,
 * and the commits between them as suspects. Releases whose base can't be
 * resolved on the synced mainline (off-mainline cuts, the sync cutoff) can't
 * be encoded that way and are called out instead of silently allowed.
 */
export function AddRegressionDialog(props: {
  /** The releases that can be picked — EOL lines left out. */
  tags: TagSlice[]
  /**
   * Every synced release, for finding a release's base: the base of the
   * oldest pickable release may itself be end of life.
   */
  allTags?: TagSlice[]
  commitsBySha: Map<string, BisectCommit>
  createdBy: string
  /** Opened from a release row — that release starts selected (still changeable). */
  initialTag?: string
  onClose: () => void
  /** Must settle (the tool toasts failures) — the submit stays disabled until it does. */
  onCreate: (input: ManualRegressionInput) => Promise<unknown>
}) {
  const {tags, allTags = tags, commitsBySha, createdBy, initialTag, onClose, onCreate} = props
  const [selectedTagName, setSelectedTagName] = useState(initialTag ?? '')
  const [description, setDescription] = useState('')
  const [severity, setSeverity] = useState('')
  const [linearIssue, setLinearIssue] = useState('')
  const [fixedIn, setFixedIn] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tagBySha = useMemo(() => new Map(allTags.map((tag) => [tag.sha, tag.tag])), [allTags])
  const selected = tags.find((tag) => tag.tag === selectedTagName)

  // The blamed release's endpoints: base release → this release, with the
  // commits strictly between as suspects (chain[0] is the bad endpoint,
  // chain[last] the good one)
  const encoded = useMemo(() => {
    if (!selected) return null
    const baseTagName = baseTagOf(commitsBySha, tagBySha, selected)
    const baseTag = baseTagName ? allTags.find((tag) => tag.tag === baseTagName) : undefined
    if (!baseTag) return {ok: false as const}
    const chain = buildChain(commitsBySha, baseTag.sha, selected.sha)
    if (!chain.ok) return {ok: false as const}
    return {
      ok: true as const,
      baseTag,
      suspectShas: chain.chain.slice(1, -1).map((commit) => commit.sha),
    }
  }, [selected, commitsBySha, tagBySha, allTags])

  // A fix can only ship after the release that introduced the regression
  const fixCandidates = useMemo(
    () =>
      selected
        ? tags
            .filter((candidate) => compareTagsSemverDesc(candidate.tag, selected.tag) < 0)
            .toSorted((a, b) => compareTagsSemverDesc(a.tag, b.tag))
        : [],
    [tags, selected],
  )
  // Changing the introducing release can make the chosen fix older than it
  const fixedInValid = fixCandidates.some((candidate) => candidate.tag === fixedIn)

  const blocked = !selected || !encoded?.ok || description.trim() === ''

  return (
    <Dialog id="releases-add-regression" header="Add regression" width={1} onClose={onClose}>
      <Box padding={4}>
        <VStack gap={4}>
          <Text size={1} muted>
            Pin a regression on the release that introduced it — for issues found outside a bisect
            (user reports, support tickets). It is recorded as a concluded bisect session, so it
            counts in the regression badge and can be drilled into later.
          </Text>

          <VStack gap={2}>
            <Text size={1} weight="medium">
              Introduced in
            </Text>
            <Select
              fontSize={1}
              aria-label="Introduced in release"
              value={selectedTagName}
              onChange={(event) => setSelectedTagName(event.currentTarget.value)}
            >
              <option value="">Pick a release…</option>
              {tags.map((tag) => (
                <option key={tag._id} value={tag.tag}>
                  {tag.tag} ({tag.taggedAt.slice(0, 10)})
                </option>
              ))}
            </Select>
          </VStack>

          {selected && encoded && !encoded.ok && (
            <Card padding={3} radius={2} tone="caution">
              <Text size={1}>
                {selected.tag} has no resolvable previous release on the synced mainline
                (off-mainline cut, or before the sync cutoff) — its regressions can't be recorded
                here.
              </Text>
            </Card>
          )}
          {selected && encoded?.ok && (
            <Text size={1} muted>
              Recorded as {encoded.baseTag.tag} → {selected.tag}
              {encoded.suspectShas.length > 0
                ? `, with the ${pluralize(encoded.suspectShas.length, 'commit')} between them as suspects.`
                : '.'}
            </Text>
          )}

          <VStack gap={2}>
            <Text size={1} weight="medium">
              What broke
            </Text>
            <TextArea
              rows={2}
              fontSize={1}
              placeholder="Describe the regression…"
              value={description}
              onChange={(event) => setDescription(event.currentTarget.value)}
            />
          </VStack>

          <VStack gap={2}>
            <Text size={1} weight="medium">
              Severity (optional)
            </Text>
            <Select
              fontSize={1}
              aria-label="Severity"
              value={severity}
              onChange={(event) => setSeverity(event.currentTarget.value)}
            >
              <option value="">Not rated</option>
              {SEVERITIES.map((step) => (
                <option key={step} value={step}>
                  {SEVERITY_LABEL[step]}
                </option>
              ))}
            </Select>
          </VStack>

          <VStack gap={2}>
            <Text size={1} weight="medium">
              Linear issue (optional)
            </Text>
            <TextInput
              fontSize={1}
              placeholder="e.g. SAPP-1234"
              value={linearIssue}
              onChange={(event) => setLinearIssue(event.currentTarget.value)}
            />
          </VStack>

          <VStack gap={2}>
            <Text size={1} weight="medium">
              Fixed in (optional)
            </Text>
            <Select
              fontSize={1}
              aria-label="Fixed in release"
              value={fixedInValid ? fixedIn : ''}
              disabled={!selected}
              onChange={(event) => setFixedIn(event.currentTarget.value)}
            >
              <option value="">Not fixed yet</option>
              {fixCandidates.map((candidate) => (
                <option key={candidate._id} value={candidate.tag}>
                  {candidate.tag}
                </option>
              ))}
            </Select>
          </VStack>

          <Flex gap={2} justifyContent="flex-end">
            <Button mode="ghost" text="Cancel" onClick={onClose} />
            <Button
              tone="critical"
              text={submitting ? 'Adding…' : 'Add regression'}
              disabled={blocked || submitting}
              onClick={() => {
                if (!selected || !encoded?.ok || submitting) return
                setSubmitting(true)
                // On success the tool unmounts this dialog; on failure the
                // button re-arms next to the error toast
                void onCreate({
                  good: {sha: encoded.baseTag.sha, label: encoded.baseTag.tag},
                  bad: {sha: selected.sha, label: selected.tag},
                  suspectShas: encoded.suspectShas,
                  description: description.trim(),
                  severity: isSeverity(severity) ? severity : undefined,
                  linearIssue: linearIssue.trim() || undefined,
                  fixedIn: fixedInValid ? fixedIn : undefined,
                  createdBy,
                }).finally(() => setSubmitting(false))
              }}
            />
          </Flex>
        </VStack>
      </Box>
    </Dialog>
  )
}
