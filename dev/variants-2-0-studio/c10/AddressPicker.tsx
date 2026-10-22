import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {DocumentIcon} from '@sanity/icons/Document'
import {DocumentsIcon} from '@sanity/icons/Documents'
import {PackageIcon} from '@sanity/icons/Package'
import {Box, Button as UIButton, Card, Flex, Layer, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuButton} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {
  type ComponentType,
  isValidElement,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import {createPortal} from 'react-dom'
import {ReleaseAvatarIcon, useActiveReleases, usePerspective, useSchema, useTemplates} from 'sanity'
import {useRouter} from 'sanity/router'

import {getReleaseIdFromReleaseDocumentId} from '../../../packages/sanity/src/core/releases/util/getReleaseIdFromReleaseDocumentId'
import {isReleaseScheduledOrScheduling} from '../../../packages/sanity/src/core/releases/util/util'
import {useInitialValueResolverContext} from '../../../packages/sanity/src/core/store/document/useInitialValue'
import {resolveInitialValue} from '../../../packages/sanity/src/core/templates/resolve'
import {isCardinalityOneRelease} from '../../../packages/sanity/src/core/util/releaseUtils'
import {useVariantDocumentOperations} from '../../../packages/sanity/src/core/variants/hooks/useVariantDocumentOperations'
import {Button} from '../../../packages/sanity/src/ui-components/button/Button'
import {MenuItem} from '../../../packages/sanity/src/ui-components/menuItem/MenuItem'
import {DimensionIcon} from '../c1/dimensionIcons'
import {useVariantDefinitions} from '../c1/world'
import {useOption} from '../options/store'

// C10 option B: one address picker across Studio (Figma C1T4EUScc9PMf5tqNo09Qs, section 656:16383, 1b: F1 658:5341, F2 658:5664).
// Picking a type in the navbar "+" (New document) or a list pane's "+" opens a small form beside the type list: Type, Variant, Add to and
// Start from, then Create document. Nothing in core is edited: a capture listener on the window takes the type item's click before Studio
// does, reads the type and template from the item's intent link, and this host draws the form in a layer beside the list. Option A (Today)
// mounts nothing, so it is stock Studio. The rows and pills follow the inventory's Create version (C4 E): ghost round pills with a search
// field in every menu with more than three options.

const BASE_LABEL = 'Base · all visitors'
const SEARCH_FROM = 4
const FLYOUT_WIDTH = 420

const shortVariantId = (id: string) => id.replace(/^_\.variants\./, '')
const matches = (query: string, text: string) =>
  !query.trim() || text.toLowerCase().includes(query.trim().toLowerCase())

/** A release's quiet second line: when it publishes ("Nov 28, 10:00"), "ASAP", or "No date". */
const DATE_FORMAT = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
})
const publishWhen = (type: string, at: string | undefined) =>
  type === 'asap' ? 'ASAP' : at ? DATE_FORMAT.format(new Date(at)) : 'No date'

/** The type list item the click came from: the navbar's New document option or a list pane's create item. */
const ITEM_SELECTOR = [
  'a[data-testid^="create-new-"]',
  'a[data-testid="action-intent-button"]',
  'a[data-testid^="action-intent-button-"]',
].join(',')

interface Opened {
  type: string
  template: string
  entry: 'navbar' | 'pane'
  /** Where the flyout goes: beside the list (or under a single "+" button). */
  left: number
  top: number
  /** The list the item sits in, which is not "outside". */
  list: HTMLElement | null
}

/** Reads `type` and `template` out of an intent link (`/intent/create/template=book;type=book/`). */
function readIntent(href: string): {type: string; template: string} | null {
  const path = decodeURIComponent(new URL(href, window.location.origin).pathname)
  const segment = path.split('/intent/create/')[1]?.split('/')[0]
  if (!segment) return null
  const params = Object.fromEntries(
    segment.split(';').map((pair) => {
      const [key, ...rest] = pair.split('=')
      return [key, rest.join('=')]
    }),
  )
  if (!params.type) return null
  return {type: params.type, template: params.template || params.type}
}

/** Mounted once in the studio layout. Renders nothing unless C10 is on option B. */
export function AddressPickerHost() {
  const option = useOption('c10')
  if (option !== 'b') return null
  return <AddressPickerListener />
}

function AddressPickerListener() {
  const [opened, setOpened] = useState<Opened | null>(null)

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      // A modified click keeps its browser meaning (a new tab).
      if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
        return
      const item = (event.target as Element | null)?.closest<HTMLAnchorElement>(ITEM_SELECTOR)
      if (!item) return
      const intent = readIntent(item.getAttribute('href') ?? '')
      if (!intent) return
      event.preventDefault()
      event.stopPropagation()
      event.stopImmediatePropagation()
      const navbar = item.dataset.testid?.startsWith('create-new-') ?? false
      const list =
        item.closest<HTMLElement>('[data-ui="Popover"]') ??
        item.closest<HTMLElement>('[data-ui="Menu"]')
      const anchor = (list ?? item).getBoundingClientRect()
      const besideList = Boolean(list)
      let left = besideList ? anchor.right + 6 : anchor.left
      const top = besideList ? anchor.top : anchor.bottom + 6
      // Beside the list on the side with room (the navbar list sits at the right edge), else as far right as fits.
      if (besideList && left + FLYOUT_WIDTH > window.innerWidth - 8)
        left = anchor.left - 6 - FLYOUT_WIDTH
      left = Math.max(8, Math.min(left, window.innerWidth - FLYOUT_WIDTH - 8))
      setOpened({...intent, entry: navbar ? 'navbar' : 'pane', left, top, list})
    }
    window.addEventListener('click', onClick, true)
    return () => window.removeEventListener('click', onClick, true)
  }, [])

  if (!opened) return null
  return (
    <AddressFlyout
      key={`${opened.type}:${opened.template}:${opened.left}:${opened.top}`}
      onClose={() => setOpened(null)}
      opened={opened}
    />
  )
}

/** One dropdown: a round ghost pill that opens one menu, with a search field when it has more than three options (as C4 E). */
function PillMenu(props: {
  testId: string
  text: string
  icon?: ReactNode
  searchLabel: string
  count: number
  onOpenChange: (open: boolean) => void
  children: (query: string) => ReactNode
}) {
  const [query, setQuery] = useState('')
  const searchable = props.count >= SEARCH_FROM
  return (
    <MenuButton
      button={
        <UIButton
          data-address-pill=""
          data-testid={props.testId}
          mode="ghost"
          padding={0}
          radius="full"
          title={props.text}
        >
          <Flex align="center" data-address-pill-row="">
            {props.icon ? (
              <span data-address-glyph="">
                <Text size={1}>{props.icon}</Text>
              </span>
            ) : null}
            <Box data-address-pill-text="" flex={1}>
              <Text size={1} textOverflow="ellipsis">
                {props.text}
              </Text>
            </Box>
            <span data-address-glyph="">
              <Text size={1}>
                <ChevronDownIcon />
              </Text>
            </span>
          </Flex>
        </UIButton>
      }
      id={props.testId}
      menu={
        <Menu
          data-no-focus-lock="true"
          data-testid={`${props.testId}-menu`}
          style={{minWidth: 240}}
        >
          {searchable ? (
            <Box padding={1}>
              <TextInput
                aria-label={props.searchLabel}
                data-testid={`${props.testId}-search`}
                fontSize={1}
                onChange={(event) => setQuery(event.currentTarget.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    // The menu does not hear an Escape typed in the search field: close it from its pill.
                    event.preventDefault()
                    event.stopPropagation()
                    event.currentTarget.ownerDocument
                      .querySelector<HTMLElement>(`[data-testid="${props.testId}"]`)
                      ?.click()
                    return
                  }
                  if (!['ArrowDown', 'ArrowUp'].includes(event.key)) event.stopPropagation()
                }}
                placeholder={props.searchLabel}
                value={query}
              />
            </Box>
          ) : null}
          {props.children(searchable ? query : '')}
        </Menu>
      }
      onClose={() => {
        setQuery('')
        props.onOpenChange(false)
      }}
      onOpen={() => props.onOpenChange(true)}
      popover={{
        constrainSize: true,
        fallbackPlacements: ['top-start', 'bottom-end', 'top-end'],
        placement: 'bottom-start',
        portal: true,
        preventOverflow: true,
      }}
    />
  )
}

/** A row of the form: the icon in a 25px gutter, the label, and the pill (Figma 1b, row · Add to). */
function Row(props: {icon: ReactNode; label: string; testId: string; children: ReactNode}) {
  return (
    <div data-address-row="" data-testid={props.testId}>
      <div data-address-icon="">
        <Text muted size={1}>
          {props.icon}
        </Text>
      </div>
      <div data-address-label="">{props.label}</div>
      <div data-address-control="">{props.children}</div>
    </div>
  )
}

/** The variant tone's diamond, drawn to fill its 25-unit box like a Studio icon (as C4 E). */
function VariantDiamond() {
  return (
    <svg
      data-sanity-icon="diamond"
      fill="none"
      height="1em"
      style={{color: 'var(--card-badge-suggest-icon-color)'}}
      viewBox="0 0 25 25"
      width="1em"
    >
      <path
        d="M12.5 4.75L20.25 12.5L12.5 20.25L4.75 12.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth={1.5}
      />
    </svg>
  )
}

const FLYOUT_CSS = `
[data-address-flyout] [data-address-row] { display: grid; grid-template-columns: 25px 110px minmax(0, 1fr); column-gap: 10px; align-items: center; min-height: 33px; }
[data-address-flyout] [data-address-icon] { width: 25px; height: 25px; display: flex; align-items: center; justify-content: center; }
[data-address-flyout] [data-address-icon] svg { width: 21px; height: 21px; }
[data-address-flyout] [data-address-label] { font-family: var(--font-family-text, inherit); font-size: 13px; line-height: 17px; font-weight: 500; color: var(--card-muted-fg-color); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
[data-address-flyout] [data-address-control] { min-width: 0; display: flex; }
[data-address-flyout] [data-address-title] { font-family: var(--font-family-text, inherit); font-size: 14px; line-height: 18px; font-weight: 600; color: var(--card-fg-color); }
[data-address-pill] { max-width: 100%; min-width: 0; height: 29px; }
[data-address-pill-row] { height: 29px; padding: 0 10px 0 11px; gap: 8px; min-width: 0; }
[data-address-pill-text] { min-width: 0; }
[data-address-glyph] { display: inline-flex; justify-content: center; flex: none; }`

const dimensionOf = (v: {conditions: Record<string, string>}) => Object.keys(v.conditions)[0] ?? ''

function destIcon(d: Dest) {
  return d.id === 'drafts' ? (
    <ReleaseAvatarIcon release="drafts" />
  ) : (
    <ReleaseAvatarIcon releaseType={d.releaseType ?? 'undecided'} />
  )
}

interface Dest {
  /** `drafts`, or a release id. */
  id: string
  title: string
  sub?: string
  releaseType?: 'asap' | 'scheduled' | 'undecided'
  locked: boolean
}

function AddressFlyout({opened, onClose}: {opened: Opened; onClose: () => void}) {
  const schema = useSchema()
  const templates = useTemplates()
  const router = useRouter()
  const {selectedReleaseId, selectedVariant} = usePerspective()
  const {data: releases} = useActiveReleases()
  const variants = useVariantDefinitions()
  const {createVariantDocument} = useVariantDocumentOperations()
  const initialValueContext = useInitialValueResolverContext()
  const ref = useRef<HTMLDivElement | null>(null)
  const menusOpen = useRef(0)
  const onMenu = useCallback((open: boolean) => {
    menusOpen.current = Math.max(0, menusOpen.current + (open ? 1 : -1))
  }, [])
  const [busy, setBusy] = useState(false)
  const toast = useToast()

  // Types: one per document type with its default template, the order the type list shows.
  const types = useMemo(
    () =>
      templates
        .filter((t) => t.id === t.schemaType)
        .map((t) => ({name: t.schemaType, title: schema.get(t.schemaType)?.title ?? t.title})),
    [schema, templates],
  )
  const dests = useMemo((): Dest[] => {
    const own = releases
      .filter((r) => !isCardinalityOneRelease(r) && r.state !== 'archived')
      .map((r) => {
        const type = r.metadata.releaseType ?? 'undecided'
        const locked = isReleaseScheduledOrScheduling(r)
        return {
          id: getReleaseIdFromReleaseDocumentId(r._id),
          title: r.metadata.title || 'Untitled release',
          sub: locked
            ? `${publishWhen(type, r.metadata.intendedPublishAt)} · Scheduled, locked`
            : publishWhen(type, r.metadata.intendedPublishAt),
          releaseType: type as Dest['releaseType'],
          locked,
        }
      })
    return [{id: 'drafts', title: 'Drafts', locked: false}, ...own]
  }, [releases])

  const [type, setType] = useState(opened.type)
  const [template, setTemplate] = useState(opened.template)
  const [variantId, setVariantId] = useState<string | undefined>(
    selectedVariant ? shortVariantId(selectedVariant._id) : undefined,
  )
  // Add to: the current perspective, unless it is Published or a locked release (then Drafts).
  const [destId, setDestId] = useState(() => {
    const current = selectedReleaseId && dests.find((d) => d.id === selectedReleaseId)
    return current && !current.locked ? current.id : 'drafts'
  })

  const typeTemplates = useMemo(
    () => templates.filter((t) => t.schemaType === type && t.id !== type && !t.parameters?.length),
    [templates, type],
  )
  const typeTitle = types.find((t) => t.name === type)?.title ?? type
  const typeIcon = schema.get(type)?.icon
  const TypeIcon = typeIcon && !isValidElement(typeIcon) ? (typeIcon as ComponentType) : undefined
  const variant = variants.find((v) => shortVariantId(v._id) === variantId)
  const variantTitle = (v: (typeof variants)[number]) => v.metadata?.title ?? shortVariantId(v._id)
  const dest = dests.find((d) => d.id === destId) ?? dests[0]
  const templateTitle =
    template === type ? 'Empty' : (typeTemplates.find((t) => t.id === template)?.title ?? 'Empty')

  // Non-blocking: Escape or a pointer down outside closes it. While one of its own menus is open, that menu takes the Escape or the click.
  useEffect(() => {
    const inside = (target: EventTarget | null) =>
      target instanceof Node &&
      (Boolean(ref.current?.contains(target)) || Boolean(opened.list?.contains(target)))
    const onDown = (event: PointerEvent) => {
      if (menusOpen.current > 0 || inside(event.target)) return
      onClose()
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || menusOpen.current > 0) return
      onClose()
    }
    window.addEventListener('pointerdown', onDown, true)
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('pointerdown', onDown, true)
      window.removeEventListener('keydown', onKey, true)
    }
  }, [onClose, opened.list])

  const create = useCallback(async () => {
    const bundle = dest.id
    // One navigation sets the perspective and the variant with the new document (the router's sticky params).
    const stickyParams = {
      excludedPerspectives: null,
      perspective: bundle === 'drafts' ? null : bundle,
      variant: variantId ?? null,
    }
    if (!variant) {
      // Base: the standard new-document intent, as the type list does today, in the chosen place.
      const params = {
        type,
        template,
        ...(bundle === 'drafts' ? {} : {version: bundle}),
      }
      onClose()
      router.navigate({state: {intent: 'create', params}, stickyParams})
      return
    }
    // A variant: core's variant create (sanity.action.document.variant.create) with the start content, then open it.
    setBusy(true)
    try {
      const id = crypto.randomUUID()
      const schemaType = schema.get(type)
      const chosen = templates.find((t) => t.id === template)
      const initial =
        schemaType && chosen
          ? await resolveInitialValue(schema, chosen, {}, initialValueContext)
          : {}
      const document = {...(initial as Record<string, unknown>), _type: type}
      await createVariantDocument({
        document,
        documentGroupId: id,
        variant: {_id: variant._id as `_.variants.${string}`},
        selectedPerspective: bundle === 'drafts' ? 'drafts' : (bundle as never),
      })
      onClose()
      router.navigate({state: {intent: 'edit', params: {id, type}}, stickyParams})
    } catch (err) {
      setBusy(false)
      toast.push({
        closable: true,
        description: err instanceof Error ? err.message : String(err),
        status: 'error',
        title: 'Could not create the document',
      })
    }
  }, [
    createVariantDocument,
    dest.id,
    initialValueContext,
    onClose,
    router,
    schema,
    template,
    templates,
    toast,
    type,
    variant,
    variantId,
  ])

  return createPortal(
    <Layer zOffset={600}>
      <style>{FLYOUT_CSS}</style>
      <Card
        data-address-flyout=""
        // The navbar type list holds focus in a focus lock; this lets the form take focus beside it.
        data-no-focus-lock="true"
        data-testid="address-picker"
        // The type list closes on a mouse down outside it (document listener): a press in the form is not outside it, so the list stays.
        onMouseDown={(event) => event.stopPropagation()}
        radius={3}
        ref={ref}
        role="dialog"
        aria-label={`New ${typeTitle}`}
        shadow={3}
        style={{
          left: opened.left,
          position: 'fixed',
          top: opened.top,
          width: FLYOUT_WIDTH,
        }}
      >
        <Stack gap={3} paddingX={4} paddingTop={4} paddingBottom={4}>
          <div data-address-title="" data-testid="address-picker-title">
            New {typeTitle}
          </div>
          <Row icon={<DocumentIcon />} label="Type" testId="address-row-type">
            <PillMenu
              count={types.length}
              icon={
                TypeIcon ? <TypeIcon /> : isValidElement(typeIcon) ? typeIcon : <DocumentIcon />
              }
              onOpenChange={onMenu}
              searchLabel="Search document types"
              testId="address-type"
              text={typeTitle}
            >
              {(query) =>
                types
                  .filter((t) => matches(query, t.title))
                  .map((t) => (
                    <MenuItem
                      data-testid={`address-type-${t.name}`}
                      key={t.name}
                      onClick={() => {
                        setType(t.name)
                        setTemplate(t.name)
                      }}
                      selected={t.name === type}
                      text={t.title}
                    />
                  ))
              }
            </PillMenu>
          </Row>
          <Row icon={<VariantDiamond />} label="Variant" testId="address-row-variant">
            <PillMenu
              count={variants.length + 1}
              icon={variant ? <DimensionIcon name={dimensionOf(variant)} /> : <VariantDiamond />}
              onOpenChange={onMenu}
              searchLabel="Search variants"
              testId="address-variant"
              text={variant ? variantTitle(variant) : BASE_LABEL}
            >
              {(query) => (
                <>
                  {matches(query, BASE_LABEL) ? (
                    <MenuItem
                      data-testid="address-variant-base"
                      icon={VariantDiamond}
                      onClick={() => setVariantId(undefined)}
                      selected={!variant}
                      text={BASE_LABEL}
                    />
                  ) : null}
                  {variants
                    .filter((v) => matches(query, variantTitle(v)))
                    .map((v) => (
                      <MenuItem
                        data-testid={`address-variant-${shortVariantId(v._id)}`}
                        icon={<DimensionIcon name={dimensionOf(v)} />}
                        key={v._id}
                        onClick={() => setVariantId(shortVariantId(v._id))}
                        selected={v._id === variant?._id}
                        text={variantTitle(v)}
                      />
                    ))}
                </>
              )}
            </PillMenu>
          </Row>
          <Row icon={<PackageIcon />} label="Add to" testId="address-row-add-to">
            <PillMenu
              count={dests.length}
              icon={destIcon(dest)}
              onOpenChange={onMenu}
              searchLabel="Search releases"
              testId="address-add-to"
              text={dest.title}
            >
              {(query) =>
                dests
                  .filter((d) => matches(query, d.title))
                  .map((d) => (
                    <MenuItem
                      __unstable_subtitle={d.sub}
                      data-testid={`address-add-to-${d.id}`}
                      disabled={d.locked}
                      icon={destIcon(d) as never}
                      key={d.id}
                      onClick={() => setDestId(d.id)}
                      selected={d.id === dest.id}
                      text={d.title}
                    />
                  ))
              }
            </PillMenu>
          </Row>
          <Row icon={<DocumentsIcon />} label="Start from" testId="address-row-start-from">
            <PillMenu
              count={typeTemplates.length + 1}
              icon={<DocumentIcon />}
              onOpenChange={onMenu}
              searchLabel="Search templates"
              testId="address-start-from"
              text={templateTitle}
            >
              {(query) => (
                <>
                  {matches(query, 'Empty') ? (
                    <MenuItem
                      data-testid="address-start-from-empty"
                      icon={DocumentIcon}
                      onClick={() => setTemplate(type)}
                      selected={template === type}
                      text="Empty"
                    />
                  ) : null}
                  {typeTemplates
                    .filter((t) => matches(query, t.title))
                    .map((t) => (
                      <MenuItem
                        data-testid={`address-start-from-${t.id}`}
                        icon={DocumentIcon}
                        key={t.id}
                        onClick={() => setTemplate(t.id)}
                        selected={t.id === template}
                        text={t.title}
                      />
                    ))}
                </>
              )}
            </PillMenu>
          </Row>
          <Flex justify="flex-end" paddingTop={2}>
            <Button
              data-testid="address-create"
              disabled={busy}
              mode="default"
              onClick={() => void create()}
              text={busy ? 'Creating…' : 'Create document'}
              tone="primary"
              tooltipProps={null}
            />
          </Flex>
        </Stack>
      </Card>
    </Layer>,
    document.body,
  )
}
