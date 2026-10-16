import {ClientError} from '@sanity/client'
import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, fireEvent, render, screen, waitFor, within} from '@testing-library/react'
import {type RefAttributes, useImperativeHandle, useRef} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {type VisionCodeMirrorHandle} from '../../../codemirror/VisionCodeMirror'
import {type MutateClient} from '../../util/mutations'
import {MutateTab, useMutatePanel} from './MutateTab'

vi.mock('./CodeDiff', () => ({
  default: (props: {previous: string; next: string}) => (
    <pre data-testid="code-diff">
      {JSON.stringify({previous: props.previous, next: props.next})}
    </pre>
  ),
}))

vi.mock('sanity', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  defineLocalesResources: (_namespace: string, resources: unknown) => resources,
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.mock('../../../codemirror/VisionCodeMirror', () => ({
  VisionCodeMirror: function VisionCodeMirrorMock({
    initialValue,
    onChange,
    ref,
  }: {initialValue?: string; onChange?: (value: string) => void} & RefAttributes<
    Partial<VisionCodeMirrorHandle>
  >) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    useImperativeHandle(ref, () => ({
      resetEditorContent: (content: string) => {
        if (textareaRef.current) textareaRef.current.value = content
      },
    }))
    return (
      <textarea
        defaultValue={initialValue}
        onChange={(event) => onChange?.(event.target.value)}
        ref={textareaRef}
      />
    )
  },
}))

// @sanity/ui's ThemeProvider reads the color scheme preference
vi.stubGlobal(
  'matchMedia',
  vi.fn((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
)

const theme = buildTheme()

const CURRENT = [
  {_id: 'a', _rev: 'r1', _type: 'post', _updatedAt: '2026-10-14T10:00:00Z', title: 'Old'},
  {_id: 'b', _rev: 'r1', _type: 'post', _updatedAt: '2026-10-14T10:00:00Z', title: 'Same'},
]

const DRY_RUN = {
  transactionId: 'dry',
  results: [
    {id: 'a', operation: 'update', document: {...CURRENT[0], _rev: 'dry', title: 'New'}},
    {id: 'b', operation: 'update', document: {...CURRENT[1], _rev: 'dry'}},
    {id: 'c', operation: 'create', document: {_id: 'c', _rev: 'dry', _type: 'post'}},
  ],
}

type RequestOptions = Parameters<MutateClient['request']>[0]

function createClient(respond: (options: RequestOptions) => unknown) {
  const request = vi.fn((options: RequestOptions) => {
    try {
      return Promise.resolve(respond(options))
    } catch (error) {
      return Promise.reject(error)
    }
  })
  const client: MutateClient = {
    getDataUrl: (operation) => `/v2025-02-19/data/${operation}/test`,
    request,
    getDocuments: (ids) =>
      Promise.resolve(ids.map((id) => CURRENT.find((document) => document._id === id) ?? null)),
  }
  return {client, request}
}

function Harness(props: {
  client: MutateClient
  dataset?: string
  result?: unknown
  onApplied?: () => void
}) {
  const mutate = useMutatePanel()
  return (
    <MutateTab
      canRequest
      client={props.client}
      dataset={props.dataset ?? 'test'}
      hiddenFields={['_rev', '_updatedAt']}
      mutate={mutate}
      onApplied={props.onApplied ?? (() => undefined)}
      result={props.result}
    />
  )
}

function renderTab(props: Parameters<typeof Harness>[0]) {
  const ui = (next: Parameters<typeof Harness>[0]) => (
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <Harness {...next} />
      </LayerProvider>
    </ThemeProvider>
  )
  const view = render(ui(props))
  return {...view, rerenderWith: (next: Parameters<typeof Harness>[0]) => view.rerender(ui(next))}
}

function editor(): HTMLTextAreaElement {
  return within(screen.getByTestId('vista-mutate-editor')).getByRole('textbox')
}

function write(text: string) {
  fireEvent.change(editor(), {target: {value: text}})
}

function button(testId: string): HTMLButtonElement {
  return screen.getByTestId(testId) as HTMLButtonElement
}

const PATCH = JSON.stringify([{patch: {query: '*[_type == "post"]', set: {title: 'New'}}}])

describe('MutateTab', () => {
  afterEach(() => cleanup())

  it('shows what a dry run would change in each document, and applies exactly that', async () => {
    const {client, request} = createClient((options) =>
      options.query.dryRun ? DRY_RUN : {transactionId: 'tx-1', results: DRY_RUN.results},
    )
    const onApplied = vi.fn()
    renderTab({client, onApplied})

    write(PATCH)
    expect(button('vista-mutate-apply').disabled).toBe(true)
    fireEvent.click(button('vista-mutate-preview'))
    const preview = await screen.findByTestId('vista-mutate-preview-result')

    expect(
      within(preview)
        .getAllByTestId('vista-mutate-operation')
        .map((badge) => badge.textContent),
    ).toEqual([
      'vista.mutate.operation.update',
      'vista.mutate.operation.none',
      'vista.mutate.operation.create',
    ])
    expect(screen.getByTestId('vista-mutate-summary').textContent).toBe(
      'vista.mutate.summary:{"changed":2,"unchanged":1}',
    )
    // The changed documents' diffs are open (once the lazy diff has loaded), without the fields
    // that change with every write
    await waitFor(() => expect(within(preview).getAllByTestId('code-diff')).toHaveLength(2))
    const diffs = within(preview).getAllByTestId('code-diff')
    const first = JSON.parse(diffs[0].textContent ?? '{}')
    expect(JSON.parse(first.previous)).toEqual({_id: 'a', _type: 'post', title: 'Old'})
    expect(JSON.parse(first.next)).toEqual({_id: 'a', _type: 'post', title: 'New'})
    expect(JSON.parse(diffs[1].textContent ?? '{}').previous).toBe('')

    fireEvent.click(button('vista-mutate-apply'))
    await screen.findByTestId('vista-mutate-applied')
    expect(request).toHaveBeenCalledTimes(2)
    expect(request.mock.calls[1][0]).toMatchObject({
      method: 'POST',
      body: {mutations: JSON.parse(PATCH)},
      query: {returnIds: 'true', visibility: 'sync', autoGenerateArrayKeys: 'true'},
    })
    expect(request.mock.calls[1][0].query).not.toHaveProperty('dryRun')
    expect(onApplied).toHaveBeenCalledTimes(1)
    expect(screen.getByTestId('vista-mutate-applied').textContent).toBe(
      'vista.mutate.applied:{"dataset":"test","transactionId":"tx-1","count":3}',
    )
    expect(screen.queryByTestId('vista-mutate-preview-result')).toBeNull()
  })

  it('only applies a dry run of the mutations, dataset and options as they are', async () => {
    const {client} = createClient(() => DRY_RUN)
    const {rerenderWith} = renderTab({client})
    write(PATCH)
    fireEvent.click(button('vista-mutate-preview'))
    await screen.findByTestId('vista-mutate-preview-result')
    expect(button('vista-mutate-apply').disabled).toBe(false)

    write(PATCH.replace('New', 'Newer'))
    expect(screen.getByTestId('vista-mutate-stale')).toBeTruthy()
    expect(button('vista-mutate-apply').disabled).toBe(true)
    write(PATCH)
    expect(button('vista-mutate-apply').disabled).toBe(false)

    fireEvent.click(screen.getByTestId('vista-mutate-auto-keys'))
    expect(button('vista-mutate-apply').disabled).toBe(true)
    fireEvent.click(screen.getByTestId('vista-mutate-auto-keys'))
    expect(button('vista-mutate-apply').disabled).toBe(false)

    rerenderWith({client, dataset: 'production'})
    expect(button('vista-mutate-apply').disabled).toBe(true)
    expect(button('vista-mutate-apply').textContent).toBe(
      'vista.mutate.apply:{"dataset":"production"}',
    )
  })

  it('applies nothing when the dry run changes nothing', async () => {
    const {client} = createClient(() => ({results: [DRY_RUN.results[1]]}))
    renderTab({client})
    write(PATCH)
    fireEvent.click(button('vista-mutate-preview'))
    await screen.findByTestId('vista-mutate-preview-result')
    expect(button('vista-mutate-apply').disabled).toBe(true)
    expect(screen.queryAllByTestId('code-diff')).toHaveLength(0)
  })

  it('explains mutations that cannot run, and what the API says is wrong with them', async () => {
    const {client} = createClient(() => {
      throw new ClientError({
        statusCode: 409,
        headers: {},
        body: {
          error: {
            type: 'mutationError',
            description: 'Mutation failed: Document by ID "a" already exists',
            items: [{index: 0, error: {description: 'Document by ID "a" already exists'}}],
          },
        },
        url: 'https://test.api.sanity.io/v2025-02-19/data/mutate/test',
        method: 'POST',
      })
    })
    renderTab({client})

    write('[{"create": ')
    expect(screen.getByTestId('vista-mutate-invalid').textContent).toContain(
      'vista.mutate.invalid-json',
    )
    expect(button('vista-mutate-preview').disabled).toBe(true)
    write('[{"create": {"_id": "a"}}, {"upsert": {}}]')
    expect(screen.getByTestId('vista-mutate-invalid').textContent).toBe(
      'vista.mutate.invalid-mutation:{"index":2}',
    )

    write('[{"create": {"_id": "a", "_type": "post"}}]')
    fireEvent.click(button('vista-mutate-preview'))
    const failure = await screen.findByTestId('vista-mutate-failure')
    expect(failure.textContent).toContain('vista.mutate.preview-failed')
    expect(failure.textContent).toContain('Mutation failed: Document by ID "a" already exists')
    expect(failure.textContent).toContain(
      'vista.mutate.failure-item:{"index":1,"message":"Document by ID \\"a\\" already exists"}',
    )
  })

  it('adds mutations aimed at the documents of the result, by the IDs they are stored under', () => {
    const {client} = createClient(() => DRY_RUN)
    renderTab({
      client,
      result: [
        {_id: 'a', _originalId: 'drafts.a', _type: 'post'},
        {_id: 'b', _type: 'post'},
      ],
    })
    fireEvent.click(screen.getByTestId('vista-mutate-add'))
    const patch = screen.getByTestId('vista-mutate-add-patch')
    expect(patch.textContent).toBe('vista.mutate.add.patch-result')
    fireEvent.click(patch)
    fireEvent.click(screen.getByTestId('vista-mutate-add'))
    fireEvent.click(screen.getByTestId('vista-mutate-add-create'))
    expect(JSON.parse(editor().value)).toEqual([
      {patch: {query: '*[_id in $ids]', params: {ids: ['drafts.a', 'b']}, set: {}}},
      {create: {_type: 'post'}},
    ])
  })
})
