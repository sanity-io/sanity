/**
 * The document pane: a header with the document's title and actions, the versions of the
 * document, the form, a footer with the publish status, validation and the publish button, and
 * the history and comments inspectors beside it. Same as the Rust studio's `document.rs`.
 */
import {AddIcon} from '@sanity/icons/Add'
import {ClockIcon} from '@sanity/icons/Clock'
import {CloseIcon} from '@sanity/icons/Close'
import {CommentIcon} from '@sanity/icons/Comment'
import {CopyIcon} from '@sanity/icons/Copy'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ErrorOutlineIcon} from '@sanity/icons/ErrorOutline'
import {JsonIcon} from '@sanity/icons/Json'
import {LaunchIcon} from '@sanity/icons/Launch'
import {PublishIcon} from '@sanity/icons/Publish'
import {RevertIcon} from '@sanity/icons/Revert'
import {TrashIcon} from '@sanity/icons/Trash'
import {UnpublishIcon} from '@sanity/icons/Unpublish'
import {Badge, Box, Button, Card, Dialog, Flex, Skeleton, Spinner, Stack, Text} from '@sanity/ui'
import {Code} from '@sanity/ui/code'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {type FocusEvent, useCallback, useEffect, useRef, useState} from 'react'

import {schemaVersion} from './app-state'
import {CommentsContext, CommentsInspector, useCommentsState} from './comments'
import {StatusDot} from './DocumentList'
import {PaneFocusContext, type PaneFocus} from './form/focus'
import {documentMarkers, Fields, referencesToPublish} from './form/Form'
import {rootTarget} from './form/target'
import {HistoryInspector, type Revision, RevisionBanner} from './history'
import {parsePath} from './paths'
import {DRAFTS, type Perspective, PUBLISHED, perspectiveParam, releaseName} from './perspective'
import {leave, PresenceAvatars, setLocation, useDocumentPresence} from './presence'
import {existingIds, localPreview} from './previews'
import {perspectiveTitle, releases, releaseTone} from './releases'
import {
  jsStudioHref,
  navigate,
  perspective as perspectiveAtom,
  setPerspective,
  withPerspective,
} from './router'
import {type Marker, schema} from './schema'
import {useAtom} from './state'
import * as store from './store'
import {pushToast} from './toasts'
import {type Tone, ReleaseDot, useDismiss} from './ui'
import {draftId, type JsonObject, timeAgo, versionId} from './util'

type Confirm = 'discard' | 'discardVersion' | 'unpublish' | 'delete'
type Inspector = 'history' | 'comments'

const CONFIRM: Record<Confirm, {header: string; description: string; button: string}> = {
  discard: {
    header: 'Discard changes?',
    description: 'The draft goes away and the document goes back to its published version.',
    button: 'Discard',
  },
  discardVersion: {
    header: 'Discard version?',
    description:
      'The document leaves the release. Its draft and published versions stay as they are.',
    button: 'Discard version',
  },
  unpublish: {
    header: 'Unpublish document?',
    description: 'The published version is removed; the content stays as a draft.',
    button: 'Unpublish',
  },
  delete: {
    header: 'Delete document?',
    description:
      "The document and its draft are deleted. This can't be undone from the JS-lite studio.",
    button: 'Delete',
  },
}

function success(title: string) {
  pushToast({status: 'success', title})
}

function perspectiveKey(value: Perspective): string {
  return perspectiveParam(value) ?? 'drafts'
}

/** The id a form edits, which presence reports: the `_id` of the value it shows (the draft, the
 * published document or a version), or the draft of a new document. */
function editedId(doc: JsonObject | null | undefined, published: string): string {
  return doc && typeof doc._id === 'string' ? doc._id : draftId(published)
}

function FormSkeleton() {
  return (
    <Stack gap={5}>
      {[0, 1, 2, 3].map((index) => (
        <Stack key={index} gap={3}>
          <Skeleton style={{width: '30%', height: '0.8125rem'}} animated />
          <Skeleton style={{width: '100%', height: '2.0625rem'}} animated />
        </Stack>
      ))}
    </Stack>
  )
}

/** The references of the document to documents that aren't published, which block publishing. */
function useUnpublishedReferences(typeName: string, doc: JsonObject | null | undefined): Marker[] {
  const references = doc ? referencesToPublish(typeName, doc) : []
  const key = JSON.stringify(references)
  const [checked, setChecked] = useState<{key: string; markers: Marker[]}>({key: '[]', markers: []})
  useEffect(() => {
    const list = JSON.parse(key) as [string, string][]
    if (list.length === 0) return
    let cancelled = false
    existingIds([...new Set(list.map(([, id]) => id))]).then(
      (existing) => {
        if (cancelled) return
        const seen = new Set<string>()
        const markers = list.flatMap(([title, id]): Marker[] => {
          const message = `${title}: Referenced document must be published`
          if (existing.has(id) || seen.has(message)) return []
          seen.add(message)
          return [{level: 'error', message}]
        })
        setChecked({key, markers})
      },
      () => undefined,
    )
    return () => {
      cancelled = true
    }
  }, [key])
  return checked.key === key ? checked.markers : []
}

function SyncStatus(props: {busy: string | undefined}) {
  const sync = useAtom(store.syncState)
  if (props.busy || sync === 'saving') {
    return (
      <Flex align="center" gap={2}>
        <Spinner size={1} />
        <Text size={1} muted>
          {props.busy ?? 'Saving…'}
        </Text>
      </Flex>
    )
  }
  if (sync === 'error') return <Badge tone="critical">Not saved</Badge>
  return null
}

function ActionsMenu(props: {
  inRelease: boolean
  canDiscard: boolean
  hasPublished: boolean
  onDuplicate: () => void
  onInspect: () => void
  onHistory: () => void
  onComments: () => void
  onConfirm: (action: Confirm) => void
}) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      placement="bottom-end"
      content={
        <Menu style={{minWidth: 200}}>
          <MenuItem text="Duplicate" icon={CopyIcon} onClick={run(props.onDuplicate)} />
          <MenuItem text="Inspect JSON" icon={JsonIcon} onClick={run(props.onInspect)} />
          <MenuItem text="History" icon={ClockIcon} onClick={run(props.onHistory)} />
          <MenuItem text="Comments" icon={CommentIcon} onClick={run(props.onComments)} />
          <MenuDivider />
          {props.inRelease ? (
            <MenuItem
              text="Discard version"
              icon={RevertIcon}
              tone="critical"
              onClick={run(() => props.onConfirm('discardVersion'))}
            />
          ) : null}
          <MenuItem
            text="Discard changes"
            icon={RevertIcon}
            disabled={!props.canDiscard}
            onClick={run(() => props.onConfirm('discard'))}
          />
          <MenuItem
            text="Unpublish"
            icon={UnpublishIcon}
            disabled={!props.hasPublished}
            onClick={run(() => props.onConfirm('unpublish'))}
          />
          <MenuItem
            text="Delete"
            icon={TrashIcon}
            tone="critical"
            onClick={run(() => props.onConfirm('delete'))}
          />
        </Menu>
      }
    >
      <Button
        ref={button}
        mode="bleed"
        icon={EllipsisHorizontalIcon}
        title="Document actions"
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

function ErrorsButton(props: {markers: Marker[]}) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  const errors = props.markers.filter((marker) => marker.level === 'error')
  if (errors.length === 0) return null
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      placement="bottom-end"
      content={
        <Stack gap={3} padding={3} style={{minWidth: 280}}>
          {props.markers.map((marker, index) => (
            <Text key={index} size={1}>
              {marker.message}
            </Text>
          ))}
        </Stack>
      }
    >
      <Button
        ref={button}
        mode="bleed"
        tone="critical"
        icon={ErrorOutlineIcon}
        text={errors.length === 1 ? '1 error' : `${errors.length} errors`}
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

function VersionChip(props: {
  target: Perspective
  label: string
  tone: Tone
  exists: boolean
  selected: boolean
}) {
  return (
    <Card
      as="button"
      border
      paddingX={2}
      paddingY={1}
      selected={props.selected}
      style={{
        borderRadius: 999,
        width: 'auto',
        flex: 'none',
        opacity: props.exists ? undefined : 0.5,
      }}
      data-testid={`version-chip-${perspectiveKey(props.target)}`}
      onClick={() => setPerspective(props.target)}
    >
      <Flex align="center" gap={2}>
        <ReleaseDot tone={props.tone} />
        <Text size={1} weight="medium">
          {props.label}
        </Text>
      </Flex>
    </Card>
  )
}

export function DocumentPane(props: {typeName: string; id: string}) {
  const {typeName, id} = props
  useAtom(schemaVersion)
  const perspective = useAtom(perspectiveAtom)
  const releaseList = useAtom(releases)
  const release = releaseName(perspective)
  const draft = draftId(id)

  store.seed(id)
  useEffect(() => store.open(id), [id])

  const snapshot = store.useDocuments(
    [draft, id],
    () => ({
      title: localPreview(id, perspective)?.title,
      versions: store.versions(id),
      loaded:
        store.isLoaded(draft) &&
        store.isLoaded(id) &&
        (release === undefined || store.versionsReady(id)),
      current: store.shown(id, perspective) ?? store.initialValue(id),
      draftDoc: store.local(draft),
      publishedDoc: store.local(id),
      versionDoc: release ? store.local(versionId(release, id)) : undefined,
    }),
    id,
  )
  const {
    title: previewTitle,
    versions,
    loaded,
    current,
    draftDoc,
    publishedDoc,
    versionDoc,
  } = snapshot
  const hasDraft = Boolean(draftDoc)
  const hasPublished = Boolean(publishedDoc)
  const inRelease = release !== undefined && versions.includes(release)
  // The release whose version the form edits: none while the document isn't in it yet.
  const editRelease = inRelease ? release : undefined

  // A revision belongs to the perspective it was opened in.
  const [viewingState, setViewingState] = useState<{key: string; revision: Revision}>()
  const viewing =
    viewingState?.key === perspectiveKey(perspective) ? viewingState.revision : undefined
  const setViewing = (revision: Revision | undefined) =>
    setViewingState(revision ? {key: perspectiveKey(perspective), revision} : undefined)
  const doc = viewing ? viewing.doc : current

  const [inspector, setInspector] = useState<Inspector>()
  const [busy, setBusy] = useState<string>()
  const [confirm, setConfirm] = useState<Confirm>()
  const [inspect, setInspect] = useState(false)

  const comments = useCommentsState({
    published: id,
    typeName,
    release,
    doc: current,
    onOpen: () => setInspector('comments'),
  })

  // Presence: where the focus is in the form, reported for the document the form shows.
  const edited = editedId(doc, id)
  const editedRef = useRef(edited)
  const focusRef = useRef<PaneFocus>({path: []})
  useEffect(() => {
    editedRef.current = edited
    setLocation(edited, focusRef.current.path, focusRef.current.selection)
  }, [edited])
  useEffect(() => () => leave(id), [id])
  const reportFocus = useCallback((focus: PaneFocus) => {
    focusRef.current = focus
    setLocation(editedRef.current, focus.path, focus.selection)
  }, [])
  const onFocusIn = (event: FocusEvent<HTMLDivElement>) => {
    const element = event.target
    // The editor reports its selection itself.
    if (element.closest('[data-testid="pt-editable"]')) return
    const text = element.closest('[data-path]')?.getAttribute('data-path')
    let path: PaneFocus['path'] = []
    try {
      path = text ? parsePath(text) : []
    } catch {
      path = []
    }
    reportFocus({path})
  }
  const onFocusOut = (event: FocusEvent<HTMLDivElement>) => {
    const next = event.relatedTarget
    if (!next || !event.currentTarget.contains(next)) reportFocus({path: []})
  }

  const present = useDocumentPresence(id)

  // Published documents, revisions, and releases the document isn't in yet are read-only, like
  // in the JS studio.
  const readOnly =
    busy !== undefined ||
    viewing !== undefined ||
    perspective.kind === 'published' ||
    (release !== undefined && !inRelease)

  const unpublishedReferences = useUnpublishedReferences(typeName, doc)
  const markers = [...documentMarkers(typeName, doc), ...unpublishedReferences]
  const errors = markers.filter((marker) => marker.level === 'error').length

  const run = (label: string, action: () => Promise<boolean>, done: (ok: boolean) => void) => {
    if (busy !== undefined) return
    setBusy(label)
    void action().then((ok) => {
      setBusy(undefined)
      done(ok)
    })
  }

  const publish = () => {
    if (!hasDraft || errors > 0 || release !== undefined) return
    run(
      'Publishing…',
      () => store.publishDocument(id),
      (ok) => {
        if (ok) success('Published')
      },
    )
  }
  const publishRef = useRef(publish)
  useEffect(() => {
    publishRef.current = publish
  })
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.altKey && event.code === 'KeyP') {
        event.preventDefault()
        publishRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const confirmed = (action: Confirm) => {
    setConfirm(undefined)
    switch (action) {
      case 'discardVersion':
        if (!release) return
        run(
          'Discarding…',
          () => store.discardVersion(id, release),
          (ok) => {
            if (ok) success('Version discarded')
          },
        )
        return
      case 'discard':
        run(
          'Discarding…',
          () => store.discardDraft(id),
          (ok) => {
            if (!ok) return
            success('Changes discarded')
            if (!hasPublished) navigate({typeName})
          },
        )
        return
      case 'unpublish':
        run(
          'Unpublishing…',
          () => store.unpublish(id),
          (ok) => {
            if (ok) success('Unpublished')
          },
        )
        return
      case 'delete':
        run(
          'Deleting…',
          () => store.deleteDocument(id),
          (ok) => {
            if (!ok) return
            success('Document deleted')
            navigate({typeName})
          },
        )
        return
      default: {
        const exhaustive: never = action
        return exhaustive
      }
    }
  }

  const duplicate = () => {
    const copy = store.duplicate(id, typeName)
    if (copy) navigate({typeName, documentId: copy})
  }

  const toggle = (which: Inspector) => {
    if (inspector === which) setInspector(undefined)
    else if (which === 'comments') comments.openInspector(undefined)
    else setInspector(which)
  }

  const title = previewTitle ?? `Untitled ${schema().typeTitle(typeName)}`

  const updatedAgo = (value: JsonObject | null | undefined) =>
    typeof value?._updatedAt === 'string' ? timeAgo(value._updatedAt) : undefined
  let status = ''
  if (editRelease) {
    const ago = updatedAgo(versionDoc)
    status = `In release ${perspectiveTitle(perspective, releaseList)}${ago ? `, edited ${ago}` : ''}`
  } else if (hasDraft && hasPublished) {
    status = `Edited ${updatedAgo(draftDoc) ?? 'just now'}`
  } else if (hasDraft) {
    status = 'Not published'
  } else if (hasPublished) {
    status = `Published ${updatedAgo(publishedDoc) ?? ''}`
  }

  const publishLabel =
    busy === 'Publishing…' ? 'Publishing…' : !hasDraft && hasPublished ? 'Published' : 'Publish'

  const chips: {target: Perspective; label: string; tone: Tone; exists: boolean}[] = [
    {target: PUBLISHED, label: 'Published', tone: 'positive', exists: hasPublished},
    {target: DRAFTS, label: 'Draft', tone: 'caution', exists: hasDraft},
    ...versions.map((name) => {
      const target: Perspective = {kind: 'release', name}
      const found = releaseList.find((item) => item.name === name)
      return {
        target,
        label: perspectiveTitle(target, releaseList),
        tone: found ? releaseTone(found) : ('neutral' as Tone),
        exists: true,
      }
    }),
  ]

  let banner = null
  if (viewing) {
    banner = (
      <RevisionBanner
        viewing={viewing}
        onBack={() => setViewing(undefined)}
        onRestore={(revision) => {
          store.restore(id, editRelease, revision)
          setViewing(undefined)
          success('Revision restored')
        }}
      />
    )
  } else if (loaded && perspective.kind === 'published') {
    banner = (
      <Card
        tone="positive"
        paddingX={3}
        paddingY={2}
        borderBottom
        style={{flex: 'none'}}
        data-testid="published-banner"
      >
        <Flex align="center" gap={3}>
          <Box flex={1}>
            <Text size={1}>You are viewing the published version, which is read-only.</Text>
          </Box>
          <Button
            mode="ghost"
            fontSize={1}
            paddingX={2}
            paddingY={1}
            text="Edit draft"
            onClick={() => setPerspective(DRAFTS)}
          />
        </Flex>
      </Card>
    )
  } else if (loaded && release !== undefined && !inRelease) {
    banner = (
      <Card
        tone="caution"
        paddingX={3}
        paddingY={2}
        borderBottom
        style={{flex: 'none'}}
        data-testid="not-in-release-banner"
      >
        <Flex align="center" gap={3}>
          <Box flex={1}>
            <Text size={1}>
              This document isn&apos;t in the release {perspectiveTitle(perspective, releaseList)}.
            </Text>
          </Box>
          <Button
            tone="primary"
            fontSize={1}
            paddingX={3}
            paddingY={2}
            icon={AddIcon}
            text="Add to release"
            data-testid="add-to-release"
            onClick={() => store.addToRelease(id, typeName, release)}
          />
        </Flex>
      </Card>
    )
  }

  const def = schema().get(typeName)
  let form
  if (!loaded) {
    form = <FormSkeleton />
  } else if (def) {
    form = (
      <Fields
        target={rootTarget(id, typeName, editRelease, doc, readOnly)}
        objectType={typeName}
        fields={def.fields ?? []}
        fieldsets={def.fieldsets ?? []}
        level={0}
      />
    )
  } else {
    form = (
      <Text size={1} muted>
        Unknown document type {JSON.stringify(typeName)}
      </Text>
    )
  }

  let inspectorView = null
  if (inspector === 'history') {
    inspectorView = (
      <HistoryInspector
        published={id}
        typeName={typeName}
        release={editRelease}
        current={current}
        viewing={viewing}
        setViewing={setViewing}
        readOnly={readOnly && viewing === undefined}
        onClose={() => setInspector(undefined)}
      />
    )
  } else if (inspector === 'comments') {
    inspectorView = (
      <CommentsInspector comments={comments} onClose={() => setInspector(undefined)} />
    )
  }

  return (
    <CommentsContext value={comments}>
      <PaneFocusContext value={reportFocus}>
        <Flex height="fill">
          <Flex direction="column" height="fill" flex={1} style={{minWidth: 0}}>
            <Card borderBottom paddingX={3} paddingY={2} style={{flex: 'none'}}>
              <Flex align="center" gap={2}>
                <Box flex={1} paddingX={1} style={{minWidth: 0}}>
                  <Text weight="semibold" textOverflow="ellipsis">
                    {title}
                  </Text>
                </Box>
                <PresenceAvatars present={present} size={1} />
                <SyncStatus busy={busy} />
                <Button
                  mode="bleed"
                  icon={ClockIcon}
                  title="History"
                  data-testid="history-button"
                  selected={inspector === 'history'}
                  onClick={() => toggle('history')}
                />
                <Button
                  mode="bleed"
                  icon={CommentIcon}
                  title="Comments"
                  data-testid="comments-button"
                  selected={inspector === 'comments'}
                  onClick={() => toggle('comments')}
                />
                <Button
                  mode="bleed"
                  icon={LaunchIcon}
                  title="Open in the JS studio"
                  as="a"
                  href={withPerspective(jsStudioHref({typeName, documentId: id}))}
                  target="_blank"
                />
                <ActionsMenu
                  inRelease={editRelease !== undefined}
                  canDiscard={hasDraft && hasPublished && release === undefined}
                  hasPublished={hasPublished}
                  onDuplicate={duplicate}
                  onInspect={() => setInspect(true)}
                  onHistory={() => setInspector('history')}
                  onComments={() => comments.openInspector(undefined)}
                  onConfirm={setConfirm}
                />
                <Button
                  mode="bleed"
                  icon={CloseIcon}
                  title="Close"
                  onClick={() => navigate({typeName})}
                />
              </Flex>
            </Card>
            <Card borderBottom paddingX={3} paddingY={2} style={{flex: 'none'}}>
              <Flex align="center" gap={2} wrap="wrap" data-testid="version-chips">
                {chips.map((chip) => (
                  <VersionChip
                    key={perspectiveKey(chip.target)}
                    {...chip}
                    selected={perspectiveKey(chip.target) === perspectiveKey(perspective)}
                  />
                ))}
              </Flex>
            </Card>
            {banner}
            <Box flex={1} overflow="auto" style={{minHeight: 0}}>
              <div
                style={{maxWidth: 640, margin: '0 auto', padding: '1.25rem 1.25rem 6rem'}}
                onFocus={onFocusIn}
                onBlur={onFocusOut}
              >
                {form}
              </div>
            </Box>
            <Card borderTop paddingX={3} paddingY={2} style={{flex: 'none'}}>
              <Flex align="center" gap={2}>
                <Flex flex={1} align="center" gap={2} style={{minWidth: 0}}>
                  {hasDraft || hasPublished ? <StatusDot draft={hasDraft} /> : null}
                  <Text size={1} muted textOverflow="ellipsis">
                    {status}
                  </Text>
                </Flex>
                <ErrorsButton markers={markers} />
                {release === undefined && perspective.kind !== 'published' ? (
                  <Button
                    tone="positive"
                    icon={PublishIcon}
                    text={publishLabel}
                    title="Publish (Ctrl+Alt+P)"
                    disabled={!hasDraft || errors > 0 || busy !== undefined}
                    loading={busy === 'Publishing…'}
                    onClick={publish}
                  />
                ) : null}
              </Flex>
            </Card>
          </Flex>
          {inspectorView ? (
            <Card
              borderLeft
              height="fill"
              style={{flex: 'none', width: 360, maxWidth: '45%', minHeight: 0}}
            >
              {inspectorView}
            </Card>
          ) : null}
        </Flex>
        {confirm ? (
          <Dialog
            id="confirm-dialog"
            header={CONFIRM[confirm].header}
            width={1}
            onClose={() => setConfirm(undefined)}
            footer={
              <Flex justify="flex-end" gap={2}>
                <Button mode="bleed" text="Cancel" onClick={() => setConfirm(undefined)} />
                <Button
                  tone="critical"
                  text={CONFIRM[confirm].button}
                  onClick={() => confirmed(confirm)}
                />
              </Flex>
            }
          >
            <Text size={1}>{CONFIRM[confirm].description}</Text>
          </Dialog>
        ) : null}
        {inspect ? (
          <Dialog
            id="inspect-dialog"
            header="Inspect JSON"
            width={3}
            onClose={() => setInspect(false)}
          >
            <Box style={{maxHeight: '70vh', overflow: 'auto'}}>
              <Code size={1}>{doc ? JSON.stringify(doc, null, 2) : ''}</Code>
            </Box>
          </Dialog>
        ) : null}
      </PaneFocusContext>
    </CommentsContext>
  )
}
