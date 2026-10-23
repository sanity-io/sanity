/**
 * The island-mount runtime for Media Library config apps. The workbench CLI
 * exposes it from each config app's module-federation remote as
 * `./island-runtime`, bundled *into the remote* so custom inputs render in
 * their own React root with the remote's own React/`@sanity/ui`/`sanity`
 * copies — shipping inside the `sanity` package means whichever version a
 * config app installs brings a matching runtime. The Media Library host
 * drives it with plain-data prop pushes; the bridge contract (prop shapes,
 * absence of a manifest stamp = first dialect) is documented in the Media
 * Library repo's docs/ISLAND_FIELDS_ARCHITECTURE.md.
 *
 * The form-value providers and leaf inputs below reimplement Studio
 * internals that have no public export, on the same `sanity/_singletons`
 * contexts this bundle's hooks read.
 */
// Islands deliberately render with the plain `@sanity/ui` bundled into the config app's remote;
// `ui-components` would couple the runtime to Studio-only context the island does not synthesize.
import {
  // oxlint-disable-next-line no-restricted-imports -- see above
  Button,
  Card,
  Checkbox,
  LayerProvider,
  Select,
  Stack,
  Text,
  TextArea,
  TextInput,
  ThemeProvider,
} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {
  Component,
  type ComponentType,
  type ErrorInfo,
  type ReactNode,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import {createRoot} from 'react-dom/client'
import {type Locale, PatchEvent, set, unset} from 'sanity'
import {
  DocumentIdContext,
  FormValueContext,
  GetFormValueContext,
  LocaleContext,
  type LocaleContextValue,
} from 'sanity/_singletons'

import {ChangeIndicatorsTracker} from '../../core/changeIndicators/tracker'
import {defaultLocale} from '../../core/i18n/locales'

/** Module-level so every mount shares one theme object (hosts push `scheme` as plain data). */
const islandTheme = buildTheme()

interface IslandProps {
  scheme?: 'light' | 'dark'
  /**
   * Snapshot of the whole form document, pushed on every host render; feeds
   * this bundle's form-value contexts so `useFormValue` works unchanged.
   */
  documentValue?: unknown
  /**
   * The host's current locale, as plain data. Backs the synthesized
   * LocaleContext so `useCurrentLocale()` / `useDateTimeFormat()` work in
   * config inputs. Absent (older host): the bundle's default locale.
   */
  locale?: {id: string; title: string; weekInfo?: Locale['weekInfo']}
  /** Passed through to the input component (plain data + callbacks only). */
  inputProps: Record<string, unknown>
  /**
   * When true, inject a `renderDefault` resolved from this bundle's copies,
   * so the default input renders inside the island's own React tree.
   */
  islandRenderDefault?: boolean
}

type PathSegment = string | number | {_key: string}

/** Local equivalent of `sanity`'s internal (unexported) `getValueAtPath`. */
function getValueAtPath(value: unknown, path: PathSegment[]): unknown {
  let current: unknown = value
  for (const segment of path) {
    if (current == null) return undefined
    if (typeof segment === 'object') {
      if (!Array.isArray(current)) return undefined
      current = current.find((item) => (item as {_key?: string} | null)?._key === segment._key)
    } else {
      current = (current as Record<string | number, unknown>)[segment]
    }
  }
  return current
}

/**
 * Local equivalents of Studio's internal FormValueProvider /
 * GetFormValueProvider, backing this bundle's `useFormValue` /
 * `useGetFormValue`.
 */
function IslandFormValueProviders(props: {value: unknown; children: ReactNode}) {
  // Assigned during render, not in an effect: children call getValue() while
  // rendering, and an effect-deferred assignment would hand them the
  // previous snapshot.
  const valueRef = useRef(props.value)
  // oxlint-disable-next-line react/refs -- render-phase assignment is the point (see above)
  valueRef.current = props.value
  const getValue = useCallback((path: PathSegment[]) => getValueAtPath(valueRef.current, path), [])
  const formValue = useMemo(() => ({value: props.value as never}), [props.value])
  return (
    <GetFormValueContext.Provider value={getValue as never}>
      <FormValueContext.Provider value={formValue}>{props.children}</FormValueContext.Provider>
    </GetFormValueContext.Provider>
  )
}

/**
 * A LocaleContext value from the host-pushed locale (falling back to this
 * bundle's default), backing `useCurrentLocale()` and the Intl-based hooks
 * built on it. Locale *switching* stays host-owned: `changeLocale` is a
 * no-op — the host re-pushes when its locale changes. `__internal.i18next`
 * is plumbing the supported island surface never reaches, stubbed to
 * satisfy the shape.
 */
function buildLocaleContextValue(locale: IslandProps['locale']): LocaleContextValue {
  // The spread's remaining defaultLocale fields are the i18n resource wiring
  // (unused in islands); locale *metadata* (weekInfo) comes from the host so
  // e.g. first-day-of-week is right for non-US locales. Older hosts don't
  // push weekInfo — fall back to the bundle's default rather than crash.
  const currentLocale = locale
    ? {
        ...defaultLocale,
        id: locale.id,
        title: locale.title,
        weekInfo: locale.weekInfo ?? defaultLocale.weekInfo,
      }
    : defaultLocale
  return {
    locales: [currentLocale],
    currentLocale,
    changeLocale: () => Promise.resolve(),
    __internal: {i18next: undefined},
  } as unknown as LocaleContextValue
}

/**
 * The published document id from the host-pushed snapshot, for the
 * synthesized DocumentIdContext — guards sanity-internal components an input
 * may render (`sanity` exports no public `useDocumentId`). `null` matches an
 * absent provider.
 */
function documentIdContextValue(documentValue: unknown): {id: string} | null {
  const id = (documentValue as {_id?: unknown} | undefined)?._id
  if (typeof id !== 'string' || id === '') return null
  return {id: id.replace(/^drafts\./, '')}
}

/**
 * Normalizes this bundle's PatchEvent instances to plain patch objects, so
 * class identity never crosses to the host: the host's `PatchEvent.from`
 * recognizes PatchEvent by `instanceof`, which is always false for this
 * bundle's class. Applied to the bridged `onChange` before it reaches any
 * input — custom inputs legitimately call `onChange(PatchEvent.from(...))`,
 * same as in Studio.
 */
function normalizeOnChange(hostOnChange: unknown) {
  return (event: unknown) => {
    if (typeof hostOnChange !== 'function') return
    if (event instanceof PatchEvent) {
      for (const patch of event.patches) hostOnChange(patch)
    } else {
      hostOnChange(event)
    }
  }
}

/**
 * Cached per host callback: the host's `onChange` is reference-stable across
 * pushes, and the wrapper must be too — a fresh closure per push would
 * invalidate anything the input keys on the prop's identity.
 */
const normalizedOnChangeCache = new WeakMap<object, (event: unknown) => void>()

function withNormalizedOnChange(inputProps: Record<string, unknown>): Record<string, unknown> {
  const hostOnChange = inputProps.onChange
  if (typeof hostOnChange !== 'function') return inputProps
  let normalized = normalizedOnChangeCache.get(hostOnChange)
  if (!normalized) {
    normalized = normalizeOnChange(hostOnChange)
    normalizedOnChangeCache.set(hostOnChange, normalized)
  }
  return {...inputProps, onChange: normalized}
}

interface DefaultInputProps {
  value?: unknown
  readOnly?: unknown
  schemaType?: {name?: string; jsonType?: string; options?: {list?: unknown[]}}
  elementProps?: Record<string, unknown>
  onChange?: unknown
}

function optionValue(option: unknown): string {
  if (option && typeof option === 'object' && 'value' in option) {
    return String((option as {value: unknown}).value)
  }
  return String(option)
}

/**
 * Minimal stand-in for the FormBuilder's default input resolution (the
 * `sanity` package exports no standalone leaf inputs). Covers the leaf types
 * aspect fields use; emits the same plain `set`/`unset` patches.
 */
function DefaultLeafInput(props: DefaultInputProps) {
  const schemaType = props.schemaType
  const readOnly = Boolean(props.readOnly)
  // Guarded here, not per control: don't rely on the bundled @sanity/ui
  // version enforcing readOnly on Checkbox/Select. normalizeOnChange is a
  // second layer here (mountIsland normalizes the bridged onChange) so the
  // default input stays safe when renderDefault is handed arbitrary props.
  const onChange = readOnly ? () => undefined : normalizeOnChange(props.onChange)
  // Focus/blur are dropped: the island container is the single forwarding
  // path (with its intra-island relatedTarget guard — see IslandFieldInput).
  const {
    onFocus: _hostOnFocus,
    onBlur: _hostOnBlur,
    ...elementProps
  } = (props.elementProps ?? {}) as Record<string, unknown>

  const list = schemaType?.options?.list
  if (list?.length) {
    const current = props.value == null ? '' : String(props.value)
    // A <select> always yields strings; a number field with an options.list
    // must not have "2" written to it.
    const isNumber = (schemaType?.name ?? schemaType?.jsonType) === 'number'
    return (
      <Select
        {...(elementProps as object)}
        value={current}
        readOnly={readOnly}
        onChange={(event) => {
          const next = event.currentTarget.value
          if (next === '') {
            onChange(unset())
            return
          }
          if (isNumber) {
            const parsed = Number(next)
            // Unparseable option on a number field (config bug): drop the
            // patch rather than write NaN (serializes to null).
            if (Number.isFinite(parsed)) onChange(set(parsed))
            return
          }
          onChange(set(next))
        }}
      >
        {/* oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- islands have no
            Studio i18n framework; the synthesized LocaleContext carries no resources */}
        <option value="" aria-label="Empty" />
        {list.map((option) => {
          const value = optionValue(option)
          return (
            <option key={value} value={value}>
              {option && typeof option === 'object' && 'title' in option
                ? String((option as {title: unknown}).title)
                : value}
            </option>
          )
        })}
      </Select>
    )
  }

  switch (schemaType?.name ?? schemaType?.jsonType) {
    case 'boolean':
      return (
        <Checkbox
          {...(elementProps as object)}
          checked={Boolean(props.value)}
          readOnly={readOnly}
          onChange={(event) => onChange(set(event.currentTarget.checked))}
        />
      )
    case 'number':
      return (
        <DefaultNumberInput
          elementProps={elementProps}
          // Number.isFinite, not typeof: NaN !== NaN would re-trigger the
          // buffer's derived-state reset every render — an infinite loop.
          value={Number.isFinite(props.value) ? (props.value as number) : undefined}
          readOnly={readOnly}
          onChange={onChange}
        />
      )
    case 'text':
      return (
        <TextArea
          {...(elementProps as object)}
          rows={3}
          value={typeof props.value === 'string' ? props.value : ''}
          readOnly={readOnly}
          onChange={(event) => {
            const next = event.currentTarget.value
            onChange(next === '' ? unset() : set(next))
          }}
        />
      )
    default:
      return (
        <TextInput
          {...(elementProps as object)}
          value={typeof props.value === 'string' ? props.value : ''}
          readOnly={readOnly}
          onChange={(event) => {
            const next = event.currentTarget.value
            onChange(next === '' ? unset() : set(next))
          }}
        />
      )
  }
}

/**
 * Number entry buffers the raw text locally: a fully controlled input would
 * echo the parsed number back on the next push (typing `1.` re-renders as
 * `"1"`, so decimals could never be typed). Only finite parses are committed
 * — NaN would serialize to null and silently clear the field.
 */
function DefaultNumberInput({
  elementProps,
  value,
  readOnly,
  onChange,
}: {
  elementProps: Record<string, unknown>
  value: number | undefined
  readOnly: boolean
  onChange: (patch: unknown) => void
}) {
  const [entry, setEntry] = useState<{text: string; committed: number | undefined}>(() => ({
    text: value == null ? '' : String(value),
    committed: value,
  }))
  const focusedRef = useRef(false)

  // Adopt external edits (render-phase derived-state reset) — but never while
  // focused: a push can carry a value older than the newest local commit,
  // and adopting that stale echo would clobber in-progress typing.
  // oxlint-disable-next-line react/refs -- the focus flag must gate the render-phase reset itself
  if (!focusedRef.current && entry.committed !== value) {
    setEntry({text: value == null ? '' : String(value), committed: value})
  }

  return (
    <TextInput
      {...(elementProps as object)}
      type="number"
      // Same as Studio's NumberInput: without it the browser's default step
      // of 1 marks decimals as stepMismatch and the stepper skips them.
      step="any"
      value={entry.text}
      readOnly={readOnly}
      onFocus={() => {
        focusedRef.current = true
      }}
      onBlur={() => {
        focusedRef.current = false
        // Adopt anything external that arrived while focused. If this catches
        // a stale echo (blur racing the last commit's round-trip), the
        // commit's own echo re-adopts the right value next push.
        if (entry.committed !== value) {
          setEntry({text: value == null ? '' : String(value), committed: value})
        }
      }}
      onChange={(event) => {
        const raw = event.currentTarget.value
        if (raw === '') {
          // '' also means "mid-entry of unparseable text" ('-', '1e') —
          // badInput tells that apart from a genuinely empty field.
          if (event.currentTarget.validity.badInput) return
          setEntry({text: '', committed: undefined})
          onChange(unset())
          return
        }
        const parsed = Number(raw)
        if (Number.isFinite(parsed)) {
          setEntry({text: raw, committed: parsed})
          onChange(set(parsed))
        } else {
          // In-progress entry: buffer it, patch nothing.
          setEntry((prev) => ({text: raw, committed: prev.committed}))
        }
      }}
    />
  )
}

/** Module-level so every push hands inputs the same `renderDefault` identity. */
function islandRenderDefault(props: Record<string, unknown>) {
  return <DefaultLeafInput {...(props as DefaultInputProps)} />
}

function withIslandRenderDefault(inputProps: Record<string, unknown>): Record<string, unknown> {
  return {...inputProps, renderDefault: islandRenderDefault}
}

function CrashedFieldCard({error, onRetry}: {error: Error; onRetry: () => void}) {
  return (
    <Card padding={3} radius={2} tone="critical" border>
      <Stack gap={3}>
        <Text size={1} weight="medium">
          This field couldn&apos;t be loaded
        </Text>
        <Text size={1} muted textOverflow="ellipsis">
          {String(error.message || error)}
        </Text>
        {/* oxlint-disable-next-line @sanity/i18n/no-attribute-string-literals -- islands have no
            Studio i18n framework; the synthesized LocaleContext carries no resources */}
        <Button fontSize={1} mode="ghost" tone="critical" text="Retry" onClick={onRetry} />
      </Stack>
    </Card>
  )
}

/**
 * Renders the themed failure card when the custom input crashes — without a
 * boundary the island root unmounts and the field goes silently blank.
 * Covers render/lifecycle errors only (event-handler errors don't reach
 * boundaries, but they don't blank the field either).
 */
class IslandErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state: {error: Error | null} = {error: null}

  static getDerivedStateFromError(error: Error): {error: Error} {
    return {error}
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // The field developer's console is the debugging surface.
    console.error('[islandRuntime] Custom input crashed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <CrashedFieldCard error={this.state.error} onRetry={() => this.setState({error: null})} />
      )
    }
    return this.props.children
  }
}

/**
 * Outermost boundary: covers the providers themselves (a concurrent root
 * never throws render errors out of `root.render()`, so nothing else would
 * catch them). Plain-DOM fallback — a provider failure can mean `@sanity/ui`
 * is unusable.
 */
class RootErrorBoundary extends Component<{children: ReactNode}, {error: Error | null}> {
  state: {error: Error | null} = {error: null}

  static getDerivedStateFromError(error: Error): {error: Error} {
    return {error}
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[islandRuntime] Island providers crashed', error, info.componentStack)
  }

  render() {
    if (this.state.error) {
      return (
        <div role="alert" style={{fontSize: '13px', lineHeight: 1.4}}>
          This field couldn&apos;t be loaded: {String(this.state.error.message || this.state.error)}
        </div>
      )
    }
    return this.props.children
  }
}

/**
 * Handle returned by {@link mountIsland} — the host's only surface for
 * driving a mounted island.
 *
 * @beta
 */
export interface IslandHandle {
  update(next: IslandProps): void
  unmount(): void
}

/**
 * Mount a field input in an isolated root owned by this bundle's React,
 * themed by this bundle's `@sanity/ui` (host scheme passed as plain data).
 *
 * @beta
 */
export function mountIsland(
  container: HTMLElement,
  component: ComponentType<Record<string, unknown>>,
  initial: IslandProps,
): IslandHandle {
  const root = createRoot(container)
  const Input = component
  let current = initial
  const render = () => {
    // Normalized before the input ever sees it, so PatchEvents from custom
    // inputs are flattened too — not just DefaultLeafInput's patches.
    const normalizedProps = withNormalizedOnChange(current.inputProps)
    const inputProps = current.islandRenderDefault
      ? withIslandRenderDefault(normalizedProps)
      : normalizedProps
    root.render(
      <RootErrorBoundary>
        <ThemeProvider theme={islandTheme} scheme={current.scheme ?? 'light'}>
          {/* Synthesized FormBuilder context: LayerProvider (useLayer),
              ChangeIndicatorsTracker (useChangeIndicatorsReporter throws
              without it), LocaleContext from the host-pushed locale,
              DocumentIdContext from the snapshot's _id, and the form-value
              contexts backing useFormValue. */}
          <LayerProvider>
            <ChangeIndicatorsTracker>
              <LocaleContext.Provider value={buildLocaleContextValue(current.locale)}>
                <DocumentIdContext.Provider value={documentIdContextValue(current.documentValue)}>
                  <IslandFormValueProviders value={current.documentValue}>
                    <IslandErrorBoundary>
                      <Input {...inputProps} />
                    </IslandErrorBoundary>
                  </IslandFormValueProviders>
                </DocumentIdContext.Provider>
              </LocaleContext.Provider>
            </ChangeIndicatorsTracker>
          </LayerProvider>
        </ThemeProvider>
      </RootErrorBoundary>,
    )
  }
  try {
    render()
  } catch (error) {
    // Don't leak the root: the host gets no handle for a failed mount, so
    // its cleanup could never unmount, and a later createRoot() on the same
    // container would warn and double-render.
    root.unmount()
    throw error
  }
  return {
    update(next: IslandProps) {
      current = next
      render()
    },
    unmount() {
      root.unmount()
    },
  }
}
