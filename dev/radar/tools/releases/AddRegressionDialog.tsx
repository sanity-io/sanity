import {Box, Button, Card, Dialog, Flex, Select, Stack, Text, TextArea, TextInput} from '@sanity/ui'
import {useMemo, useState} from 'react'

import {type BisectCommit, buildChain} from '../bisect/bisect'
import {type TagSlice} from '../bisect/data'
import {type ManualRegressionInput} from '../bisect/sessions'
import {pluralize} from '../bisect/text'
import {baseTagOf} from './releaseInfo'

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
  tags: TagSlice[]
  commitsBySha: Map<string, BisectCommit>
  createdBy: string
  onClose: () => void
  /** Must settle (the tool toasts failures) — the submit stays disabled until it does. */
  onCreate: (input: ManualRegressionInput) => Promise<unknown>
}) {
  const {tags, commitsBySha, createdBy, onClose, onCreate} = props
  const [selectedTagName, setSelectedTagName] = useState('')
  const [description, setDescription] = useState('')
  const [linearIssue, setLinearIssue] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const tagBySha = useMemo(() => new Map(tags.map((tag) => [tag.sha, tag.tag])), [tags])
  const selected = tags.find((tag) => tag.tag === selectedTagName)

  // The blamed release's endpoints: base release → this release, with the
  // commits strictly between as suspects (chain[0] is the bad endpoint,
  // chain[last] the good one)
  const encoded = useMemo(() => {
    if (!selected) return null
    const baseTagName = baseTagOf(commitsBySha, tagBySha, selected)
    const baseTag = baseTagName ? tags.find((tag) => tag.tag === baseTagName) : undefined
    if (!baseTag) return {ok: false as const}
    const chain = buildChain(commitsBySha, baseTag.sha, selected.sha)
    if (!chain.ok) return {ok: false as const}
    return {
      ok: true as const,
      baseTag,
      suspectShas: chain.chain.slice(1, -1).map((commit) => commit.sha),
    }
  }, [selected, commitsBySha, tagBySha, tags])

  const blocked = !selected || !encoded?.ok || description.trim() === ''

  return (
    <Dialog id="releases-add-regression" header="Add regression" width={1} onClose={onClose}>
      <Box padding={4}>
        <Stack gap={4}>
          <Text size={1} muted>
            Pin a regression on the release that introduced it — for issues found outside a bisect
            (user reports, support tickets). It is recorded as a concluded bisect session, so it
            counts in the regression badge and can be drilled into later.
          </Text>

          <Stack gap={2}>
            <Text size={1} weight="medium">
              Introduced in
            </Text>
            <Select
              fontSize={1}
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
          </Stack>

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

          <Stack gap={2}>
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
          </Stack>

          <Stack gap={2}>
            <Text size={1} weight="medium">
              Linear issue (optional)
            </Text>
            <TextInput
              fontSize={1}
              placeholder="e.g. SAPP-1234"
              value={linearIssue}
              onChange={(event) => setLinearIssue(event.currentTarget.value)}
            />
          </Stack>

          <Flex gap={2} justify="flex-end">
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
                  linearIssue: linearIssue.trim() || undefined,
                  createdBy,
                }).finally(() => setSubmitting(false))
              }}
            />
          </Flex>
        </Stack>
      </Box>
    </Dialog>
  )
}
