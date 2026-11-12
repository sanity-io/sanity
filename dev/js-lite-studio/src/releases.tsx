/**
 * Content releases and the perspective the studio shows, like the JS studio's releases plugin:
 * the drafts, the published documents, or a release stacked on the drafts. The perspective is in
 * the URL (`?perspective=published`, `?perspective=<release name>`), as in the JS studio, so
 * links open in the same perspective in both.
 */
import {AddIcon} from '@sanity/icons/Add'
import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {Box, Button, Card, Dialog, Flex, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {useState} from 'react'

import {client} from './client'
import {DRAFTS, type Perspective, PUBLISHED, perspectiveParam} from './perspective'
import {perspective, setPerspective} from './router'
import {Atom, useAtom} from './state'
import * as store from './store'
import {POPOVER_ANCHOR, type Tone, ReleaseDot, useDismiss} from './ui'
import {isObject, randomKey} from './util'

export interface Release {
  /** The name versions use: `versions.<name>.<id>`. */
  name: string
  title: string
  releaseType: string
  intendedPublishAt?: string
  state: string
}

function releaseFromJson(value: unknown): Release | undefined {
  if (!isObject(value) || typeof value.name !== 'string') return undefined
  const metadata = isObject(value.metadata) ? value.metadata : {}
  const text = (input: unknown) => (typeof input === 'string' ? input : undefined)
  return {
    name: value.name,
    title: text(metadata.title) || 'Untitled release',
    releaseType: text(metadata.releaseType) ?? 'undecided',
    intendedPublishAt: text(metadata.intendedPublishAt),
    state: text(value.state) ?? '',
  }
}

/** The tone the JS studio gives a release (`getReleaseTone`). */
export function releaseTone(release: Release): Tone {
  switch (release.releaseType) {
    case 'asap':
      return 'caution'
    case 'scheduled':
      return 'suggest'
    default:
      return 'neutral'
  }
}

export function releaseTypeLabel(release: Release): string {
  switch (release.releaseType) {
    case 'asap':
      return 'ASAP'
    case 'scheduled':
      return release.intendedPublishAt
        ? new Date(release.intendedPublishAt).toLocaleString('en-US')
        : 'Scheduled'
    default:
      return 'Undecided'
  }
}

export const releases = new Atom<Release[]>([])
export const releasesLoaded = new Atom(false)

const QUERY =
  '*[_type == "system.release" && state in ["active", "scheduled", "scheduling"]] | order(_createdAt asc)'
let started = false

export function startReleases(): void {
  if (started) return
  started = true
  client()
    .listen('*[_type == "system.release"]', {}, {
      includeResult: false,
      events: ['welcome', 'mutation'],
      tag: 'releases.listen',
    } as never)
    .subscribe({
      next: (event: {type: string}) => {
        if (event.type === 'welcome' || event.type === 'mutation') void loadReleases()
      },
      error: () => undefined,
    })
}

async function loadReleases(): Promise<void> {
  try {
    const items = await client().fetch<unknown[]>(
      QUERY,
      {},
      {perspective: 'raw', tag: 'releases.list'},
    )
    releases.set(items.flatMap((item) => releaseFromJson(item) ?? []))
    releasesLoaded.set(true)
  } catch {
    // The listener's next event loads them again.
  }
}

export function getRelease(name: string): Release | undefined {
  return releases.get().find((release) => release.name === name)
}

/** Creates a release, like the JS studio's "Create release" dialog. */
async function createRelease(title: string, releaseType: string): Promise<string | undefined> {
  const name = `r${randomKey(8)}`
  const ok = await store.releaseAction({
    actionType: 'sanity.action.release.create',
    releaseId: name,
    metadata: {title, releaseType},
  })
  return ok ? name : undefined
}

/** The tone of a perspective: positive for the published documents, the drafts' default. */
export function perspectiveTone(value: Perspective, list: Release[]): Tone {
  switch (value.kind) {
    case 'drafts':
      return 'default'
    case 'published':
      return 'positive'
    case 'release': {
      const found = list.find((release) => release.name === value.name)
      return found ? releaseTone(found) : 'neutral'
    }
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

export function perspectiveTitle(value: Perspective, list: Release[]): string {
  switch (value.kind) {
    case 'drafts':
      return 'Drafts'
    case 'published':
      return 'Published'
    case 'release':
      return list.find((release) => release.name === value.name)?.title ?? value.name
    default: {
      const exhaustive: never = value
      return exhaustive
    }
  }
}

/** The navbar's perspective menu: the published documents, the drafts and every open release,
 * plus a button that creates one. */
export function PerspectivePicker() {
  const [open, setOpen] = useState(false)
  const [creating, setCreating] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)
  const current = useAtom(perspective)
  const list = useAtom(releases)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button, popover],
  )

  const item = (value: Perspective, subtitle?: string) => (
    <Card
      key={perspectiveParam(value) ?? 'drafts'}
      as="button"
      radius={2}
      paddingX={3}
      paddingY={2}
      selected={perspectiveParam(current) === perspectiveParam(value)}
      data-testid={`perspective-${perspectiveParam(value) ?? 'drafts'}`}
      onClick={() => {
        setOpen(false)
        setPerspective(value)
      }}
    >
      <Flex align="center" gap={3}>
        <ReleaseDot tone={perspectiveTone(value, list)} />
        <Stack gap={2} flex={1}>
          <Text size={1} weight="medium">
            {perspectiveTitle(value, list)}
          </Text>
          {subtitle ? (
            <Text size={1} muted>
              {subtitle}
            </Text>
          ) : null}
        </Stack>
      </Flex>
    </Card>
  )

  const menu = (
    <Menu gap={1} padding={1} style={{width: '18rem'}}>
      {item(PUBLISHED)}
      {item(DRAFTS)}
      <MenuDivider />
      {list.length === 0 ? (
        <Box padding={3}>
          <Text size={1} muted>
            No open releases
          </Text>
        </Box>
      ) : (
        list.map((release) =>
          item({kind: 'release', name: release.name}, releaseTypeLabel(release)),
        )
      )}
      <MenuDivider />
      <MenuItem
        text="New release"
        icon={AddIcon}
        onClick={() => {
          setOpen(false)
          setCreating(true)
        }}
      />
    </Menu>
  )

  return (
    <>
      <Popover
        open={open}
        placement="bottom-end"
        portal
        content={menu}
        ref={setPopover}
        constrainSize
      >
        <span ref={setButton} style={POPOVER_ANCHOR}>
          <Button
            mode="ghost"
            radius={2}
            paddingX={3}
            paddingY={2}
            title="Perspective"
            selected={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Flex align="center" gap={2} data-testid="perspective-menu">
              <ReleaseDot tone={perspectiveTone(current, list)} />
              <Text size={1} weight="medium">
                {perspectiveTitle(current, list)}
              </Text>
              <Text size={1} muted>
                <ChevronDownIcon />
              </Text>
            </Flex>
          </Button>
        </span>
      </Popover>
      {creating ? <CreateReleaseDialog onClose={() => setCreating(false)} /> : null}
    </>
  )
}

function CreateReleaseDialog(props: {onClose: () => void}) {
  const [title, setTitle] = useState('')
  const [releaseType, setReleaseType] = useState('asap')
  const [busy, setBusy] = useState(false)
  const create = async () => {
    if (busy) return
    setBusy(true)
    const name = await createRelease(title.trim(), releaseType)
    setBusy(false)
    if (name) {
      setPerspective({kind: 'release', name})
      props.onClose()
    }
  }
  const footer = (
    <Flex justify="flex-end" gap={2} padding={3}>
      <Button mode="bleed" text="Cancel" onClick={props.onClose} />
      <Button
        tone="primary"
        text="Create release"
        data-testid="create-release"
        loading={busy}
        onClick={create}
      />
    </Flex>
  )
  const typeButton = (value: string, label: string) => (
    <Button
      mode="bleed"
      text={label}
      selected={releaseType === value}
      onClick={() => setReleaseType(value)}
    />
  )
  return (
    <Dialog
      id="create-release-dialog"
      header="New release"
      onClose={props.onClose}
      width={1}
      footer={footer}
    >
      <Box padding={4}>
        <Stack gap={4}>
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Title
            </Text>
            <TextInput
              value={title}
              placeholder="Untitled release"
              onChange={(event) => setTitle(event.currentTarget.value)}
              data-testid="release-title"
            />
          </Stack>
          <Stack gap={3}>
            <Text size={1} weight="medium">
              Release type
            </Text>
            <Flex gap={1}>
              {typeButton('asap', 'ASAP')}
              {typeButton('undecided', 'Undecided')}
            </Flex>
          </Stack>
        </Stack>
      </Box>
    </Dialog>
  )
}
