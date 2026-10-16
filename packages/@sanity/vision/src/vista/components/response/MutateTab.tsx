import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {ChevronRightIcon} from '@sanity/icons/ChevronRight'
import {Badge, type BadgeTone, Button, Card, Label, Stack, Switch, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {Suspense, useCallback, useId, useMemo, useState} from 'react'
import {type TFunction, useTranslation} from 'sanity'
import {Box, Flex} from 'ui5'

import {DelayedSpinner} from '../../../components/DelayedSpinner'
import {visionLocaleNamespace} from '../../../i18n'
import {
  addMutation,
  applyMutations,
  type ChangeOperation,
  createMutationTemplate,
  type DocumentChange,
  documentsInResult,
  type MutateClient,
  type MutationBody,
  type MutationFailure,
  type MutationOptions,
  type MutationPreview,
  type MutationTemplate,
  previewMutations,
  readMutationFailure,
  readMutations,
} from '../../util/mutations'
import {omitFields, parseFieldPaths} from '../../util/omitFields'
import {JsonEditor} from './JsonEditor'
import {CodeDiffLoader, DiffBoundary} from './LazyCodeDiff'

/** Changes shown with their diff open; the rest open on request */
const EXPANDED_CHANGES = 3

/** What a dry run or an apply sends, and the key a dry run must match for Apply to send it */
export interface MutationRun {
  /** The dataset, the mutations and the options */
  key: string
  mutations: MutationBody[]
  options: MutationOptions
}

/** The panel's state, kept by the response panel so it survives switching panels */
export interface MutatePanelState {
  text: string
  autoGenerateArrayKeys: boolean
  /** The latest dry run, with the key of what it ran */
  preview: {key: string; result: MutationPreview} | undefined
  pending: 'preview' | 'apply' | undefined
  failure: {action: 'preview' | 'apply'; failure: MutationFailure} | undefined
  applied: {transactionId: string; documentCount: number; dataset: string} | undefined
}

const INITIAL_STATE: MutatePanelState = {
  text: '',
  autoGenerateArrayKeys: true,
  preview: undefined,
  pending: undefined,
  failure: undefined,
  applied: undefined,
}

export interface MutatePanel {
  state: MutatePanelState
  setText: (text: string) => void
  setAutoGenerateArrayKeys: (autoGenerateArrayKeys: boolean) => void
  preview: (client: MutateClient, run: MutationRun) => Promise<void>
  /** Resolves with whether the mutations were applied */
  apply: (client: MutateClient, run: MutationRun, dataset: string) => Promise<boolean>
}

export function useMutatePanel(): MutatePanel {
  const [state, setState] = useState<MutatePanelState>(INITIAL_STATE)

  const setText = useCallback((text: string) => {
    setState((current) => ({...current, text}))
  }, [])

  const setAutoGenerateArrayKeys = useCallback((autoGenerateArrayKeys: boolean) => {
    setState((current) => ({...current, autoGenerateArrayKeys}))
  }, [])

  const preview = useCallback(async (client: MutateClient, run: MutationRun) => {
    setState((current) => ({
      ...current,
      pending: 'preview',
      failure: undefined,
      applied: undefined,
    }))
    try {
      const result = await previewMutations(client, run.mutations, run.options)
      setState((current) => ({...current, pending: undefined, preview: {key: run.key, result}}))
    } catch (error) {
      setState((current) => ({
        ...current,
        pending: undefined,
        preview: undefined,
        failure: {action: 'preview', failure: readMutationFailure(error)},
      }))
    }
  }, [])

  const apply = useCallback(async (client: MutateClient, run: MutationRun, dataset: string) => {
    setState((current) => ({...current, pending: 'apply', failure: undefined}))
    try {
      const applied = await applyMutations(client, run.mutations, run.options)
      setState((current) => ({
        ...current,
        pending: undefined,
        // What it showed is what the dataset holds now
        preview: undefined,
        applied: {
          transactionId: applied.transactionId,
          documentCount: applied.documentIds.length,
          dataset,
        },
      }))
      return true
    } catch (error) {
      setState((current) => ({
        ...current,
        pending: undefined,
        failure: {action: 'apply', failure: readMutationFailure(error)},
      }))
      return false
    }
  }, [])

  return {state, setText, setAutoGenerateArrayKeys, preview, apply}
}

function describeOperation(operation: ChangeOperation, t: TFunction<'vision'>): string {
  switch (operation) {
    case 'create':
      return t('vista.mutate.operation.create')
    case 'update':
      return t('vista.mutate.operation.update')
    case 'delete':
      return t('vista.mutate.operation.delete')
    case 'none':
      return t('vista.mutate.operation.none')
    default: {
      const unknownOperation: never = operation
      return String(unknownOperation)
    }
  }
}

const OPERATION_TONES: Record<ChangeOperation, BadgeTone> = {
  create: 'positive',
  update: 'primary',
  delete: 'critical',
  none: 'default',
}

function toJson(document: Record<string, unknown> | null, hiddenPaths: string[][]): string {
  return document === null ? '' : `${JSON.stringify(omitFields(document, hiddenPaths), null, 2)}\n`
}

function ChangeRow(props: {change: DocumentChange; hiddenPaths: string[][]; expanded: boolean}) {
  const {change, hiddenPaths} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const [expanded, setExpanded] = useState(props.expanded)
  const diffId = useId()
  const changed = change.operation !== 'none'
  return (
    <Card borderBottom data-testid="vista-mutate-change" paddingX={3} paddingY={2}>
      <Flex alignItems="center" gap={2}>
        <Badge
          data-testid="vista-mutate-operation"
          fontSize={0}
          tone={OPERATION_TONES[change.operation]}
        >
          {describeOperation(change.operation, t)}
        </Badge>
        <Box flexBasis="0%" flexGrow={1} minWidth="0">
          <Text data-testid="vista-mutate-document-id" size={1} textOverflow="ellipsis">
            <code>{change.id}</code>
          </Text>
        </Box>
        {changed && (
          <Button
            aria-controls={diffId}
            aria-expanded={expanded}
            data-testid="vista-mutate-change-toggle"
            fontSize={1}
            icon={expanded ? ChevronDownIcon : ChevronRightIcon}
            mode="bleed"
            onClick={() => setExpanded((value) => !value)}
            padding={1}
            text={t('vista.mutate.changes')}
          />
        )}
      </Flex>
      {changed && expanded && (
        <Box id={diffId} paddingTop={2}>
          <DiffBoundary
            renderFallback={(retry) => (
              <Flex alignItems="center" gap={2}>
                <Text muted size={1}>
                  {t('vista.mutate.changes-failed')}
                </Text>
                <Button
                  fontSize={1}
                  mode="ghost"
                  onClick={retry}
                  padding={2}
                  text={t('vista.mutate.changes-retry')}
                />
              </Flex>
            )}
          >
            <Suspense fallback={<DelayedSpinner />}>
              <CodeDiffLoader
                lang="json"
                next={toJson(change.after, hiddenPaths)}
                previous={toJson(change.before, hiddenPaths)}
              />
            </Suspense>
          </DiffBoundary>
        </Box>
      )}
    </Card>
  )
}

function PreviewResult(props: {
  preview: MutationPreview
  /** The dry run ran other mutations, or against another dataset or with other options */
  stale: boolean
  hiddenFields: string[]
}) {
  const {preview, stale, hiddenFields} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const hiddenPaths = useMemo(() => parseFieldPaths(hiddenFields), [hiddenFields])
  const changed = preview.changes.filter((change) => change.operation !== 'none').length
  return (
    <Stack data-testid="vista-mutate-preview-result" gap={3}>
      <Flex alignItems="center" flexWrap="wrap" gap={2}>
        <Label muted size={0}>
          {t('vista.mutate.preview-heading')}
        </Label>
        <Text data-testid="vista-mutate-summary" muted size={1}>
          {t('vista.mutate.summary', {changed, unchanged: preview.changes.length - changed})}
        </Text>
      </Flex>
      {stale && (
        <Text data-testid="vista-mutate-stale" size={1}>
          {t('vista.mutate.stale')}
        </Text>
      )}
      {preview.changes.length === 0 ? (
        <Text muted size={1}>
          {t('vista.mutate.no-documents')}
        </Text>
      ) : (
        <Card border radius={2}>
          {preview.changes.map((change, index) => (
            <ChangeRow
              change={change}
              expanded={index < EXPANDED_CHANGES}
              hiddenPaths={hiddenPaths}
              key={change.id}
            />
          ))}
        </Card>
      )}
      {preview.notShown > 0 && (
        <Text muted size={1}>
          {t('vista.mutate.not-shown', {count: preview.notShown})}
        </Text>
      )}
      {hiddenFields.length > 0 && changed > 0 && (
        <Text muted size={1}>
          {t('vista.mutate.hiding', {fields: hiddenFields.join(', ')})}
        </Text>
      )}
    </Stack>
  )
}

export interface MutateTabProps {
  mutate: MutatePanel
  /** The tab's client: its dataset is where the mutations go */
  client: MutateClient
  dataset: string
  /** Requests are refused while the tab's API version is unfinished */
  canRequest: boolean
  /** The shown result, whose documents the templates aim at */
  result: unknown
  /** Fields the diffs leave out, as History's do */
  hiddenFields: string[]
  /** Called once mutations are applied, to fetch the query again */
  onApplied: () => void
}

/**
 * Authoring and testing mutations: written as the Mutations API takes them, run as a dry run
 * that compares each document they touch as it is with what they would make it, and applied in
 * one transaction once the dry run of exactly those mutations has been seen
 */
export function MutateTab(props: MutateTabProps) {
  const {mutate, client, dataset, canRequest, result, hiddenFields, onApplied} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const {state} = mutate

  const input = useMemo(() => readMutations(state.text), [state.text])
  const run = useMemo((): MutationRun | undefined => {
    if (input.status !== 'valid') return undefined
    const options = {autoGenerateArrayKeys: state.autoGenerateArrayKeys}
    return {
      key: JSON.stringify([dataset, input.mutations, options]),
      mutations: input.mutations,
      options,
    }
  }, [dataset, input, state.autoGenerateArrayKeys])
  const documents = useMemo(() => documentsInResult(result), [result])

  const previewIsCurrent = run !== undefined && state.preview?.key === run.key
  const previewChanges = state.preview
    ? state.preview.result.changes.some((change) => change.operation !== 'none') ||
      state.preview.result.notShown > 0
    : false
  const canApply = canRequest && previewIsCurrent && previewChanges && !state.pending
  const canAdd = input.status === 'empty' || input.status === 'valid'

  const addTemplate = (template: MutationTemplate) => {
    const next = addMutation(state.text, createMutationTemplate(template, documents))
    if (next !== undefined) mutate.setText(next)
  }
  const applyPreviewed = async () => {
    if (!run || !previewIsCurrent) return
    if (await mutate.apply(client, run, dataset)) onApplied()
  }

  return (
    <Box data-testid="vista-mutate" padding={3}>
      <Stack gap={4}>
        <Text muted size={1}>
          {t('vista.mutate.description')}
        </Text>
        <Stack gap={2}>
          <JsonEditor
            actions={
              <MenuButton
                button={
                  <Button
                    data-testid="vista-mutate-add"
                    disabled={!canAdd}
                    fontSize={1}
                    icon={AddIcon}
                    mode="bleed"
                    padding={2}
                    text={t('vista.mutate.add')}
                  />
                }
                id="vista-mutate-add"
                menu={
                  <Menu>
                    <MenuItem
                      data-testid="vista-mutate-add-patch"
                      fontSize={1}
                      onClick={() => addTemplate('patch')}
                      text={
                        documents.length > 0
                          ? t('vista.mutate.add.patch-result')
                          : t('vista.mutate.add.patch')
                      }
                    />
                    <MenuItem
                      data-testid="vista-mutate-add-create"
                      fontSize={1}
                      onClick={() => addTemplate('create')}
                      text={t('vista.mutate.add.create')}
                    />
                    <MenuItem
                      data-testid="vista-mutate-add-delete"
                      fontSize={1}
                      onClick={() => addTemplate('delete')}
                      text={
                        documents.length > 0
                          ? t('vista.mutate.add.delete-result')
                          : t('vista.mutate.add.delete')
                      }
                    />
                  </Menu>
                }
                popover={{placement: 'bottom-end', portal: true}}
              />
            }
            label={t('vista.mutate.mutations')}
            onChange={mutate.setText}
            testId="vista-mutate-editor"
            value={state.text}
          />
          {input.status === 'invalid-json' && (
            <Text data-testid="vista-mutate-invalid" size={1}>
              {t('vista.mutate.invalid-json', {message: input.message})}
            </Text>
          )}
          {input.status === 'not-a-list' && (
            <Text data-testid="vista-mutate-invalid" size={1}>
              {t('vista.mutate.not-a-list')}
            </Text>
          )}
          {input.status === 'invalid-mutation' && (
            <Text data-testid="vista-mutate-invalid" size={1}>
              {t('vista.mutate.invalid-mutation', {index: input.index})}
            </Text>
          )}
        </Stack>
        <Flex alignItems="flex-start" as="label" gap={3}>
          <Box paddingTop={1}>
            <Switch
              checked={state.autoGenerateArrayKeys}
              data-testid="vista-mutate-auto-keys"
              onChange={(event) => mutate.setAutoGenerateArrayKeys(event.currentTarget.checked)}
            />
          </Box>
          <Stack gap={2}>
            <Text size={1} weight="medium">
              {t('vista.mutate.auto-keys')}
            </Text>
            <Text muted size={1}>
              {t('vista.mutate.auto-keys.description')}
            </Text>
          </Stack>
        </Flex>
        <Flex alignItems="center" flexWrap="wrap" gap={2}>
          <Button
            data-testid="vista-mutate-preview"
            disabled={!run || !canRequest || state.pending !== undefined}
            fontSize={1}
            loading={state.pending === 'preview'}
            mode="ghost"
            onClick={() => run && void mutate.preview(client, run)}
            padding={2}
            text={t('vista.mutate.preview')}
          />
          <Button
            data-testid="vista-mutate-apply"
            disabled={!canApply}
            fontSize={1}
            loading={state.pending === 'apply'}
            onClick={() => void applyPreviewed()}
            padding={2}
            text={t('vista.mutate.apply', {dataset})}
            tone="critical"
          />
          {run && !previewIsCurrent && (
            <Text muted size={1}>
              {t('vista.mutate.apply-needs-preview')}
            </Text>
          )}
        </Flex>
        {state.failure && (
          <Card border data-testid="vista-mutate-failure" padding={3} radius={2} tone="critical">
            <Stack gap={3}>
              <Text size={1} weight="medium">
                {state.failure.action === 'preview'
                  ? t('vista.mutate.preview-failed')
                  : t('vista.mutate.apply-failed')}
              </Text>
              <Text size={1}>{state.failure.failure.message}</Text>
              {state.failure.failure.items.map((item) => (
                <Text key={`${item.index}:${item.message}`} size={1}>
                  {t('vista.mutate.failure-item', {index: item.index, message: item.message})}
                </Text>
              ))}
            </Stack>
          </Card>
        )}
        {state.applied && (
          <Card border data-testid="vista-mutate-applied" padding={3} radius={2} tone="positive">
            <Text size={1}>
              {t('vista.mutate.applied', {
                dataset: state.applied.dataset,
                transactionId: state.applied.transactionId,
                count: state.applied.documentCount,
              })}
            </Text>
          </Card>
        )}
        {state.preview && (
          <PreviewResult
            hiddenFields={hiddenFields}
            preview={state.preview.result}
            stale={!previewIsCurrent}
          />
        )}
      </Stack>
    </Box>
  )
}
