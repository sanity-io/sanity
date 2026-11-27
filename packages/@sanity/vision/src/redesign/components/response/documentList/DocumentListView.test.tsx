import {LayerProvider, ThemeProvider} from '@sanity/ui'
import {buildTheme} from '@sanity/ui/theme'
import {cleanup, render, screen} from '@testing-library/react'
import {type ReactNode} from 'react'
import {afterEach, describe, expect, it, vi} from 'vitest'

import {
  DOCUMENT_LIST_SHAPE,
  type ParsedDocumentList,
  parseDocumentList,
  parseSourceMapDocuments,
} from '../../../util/documentListResult'
import {DocumentListView} from './DocumentListView'

const schemaTypes = new Map<string, unknown>([['author', {name: 'author', title: 'Author'}]])

const schema = {
  get: (name: string) => schemaTypes.get(name),
}

vi.mock('sanity', () => ({
  useDataset: () => 'workspace-dataset',
  useProjectId: () => 'workspace-project',
}))

const previews = new Map<string, {title?: string; subtitle?: string}>()
const useValuePreview = vi.fn(
  ({value}: {value: {_id: string}; schemaType: unknown; perspectiveStack: unknown}) => {
    const preview = previews.get(value._id)
    return preview ? {isLoading: false, value: preview} : {isLoading: true}
  },
)

vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver', () => ({
  CommandList: ({
    items,
    renderItem,
  }: {
    items: unknown[]
    renderItem: (item: unknown, context: {activeIndex: number}) => ReactNode
  }) => (
    <div data-testid="command-list">
      {items.map((item, index) => (
        // oxlint-disable-next-line react/no-array-index-key -- a stand-in for the virtualized list
        <div key={index}>{renderItem(item, {activeIndex: index})}</div>
      ))}
    </div>
  ),
  useValuePreview: (props: {
    value: {_id: string}
    schemaType: unknown
    perspectiveStack: unknown
  }) => useValuePreview(props),
  getPublishedId: (id: string) => id.replace(/^(drafts\.|versions\.[^.]+\.)/, ''),
  isDraftId: (id: string) => id.startsWith('drafts.'),
  getVersionFromId: (id: string) => /^versions\.([^.]+)\./.exec(id)?.[1],
  SanityDefaultPreview: ({
    title,
    subtitle,
    imageUrl,
    media,
  }: {
    title?: string
    subtitle?: string
    imageUrl?: string
    media?: unknown
  }) => (
    <div data-image={imageUrl} data-media={media ? 'yes' : undefined} data-testid="preview">
      <span>{title}</span>
      {subtitle ? <span>{subtitle}</span> : null}
    </div>
  ),
  PreviewCard: ({
    as,
    children,
    href,
    'data-testid': testId,
  }: {
    'as'?: string
    'children': ReactNode
    'href'?: string
    'data-testid'?: string
  }) =>
    as === 'a' ? (
      <a data-testid={testId} href={href}>
        {children}
      </a>
    ) : (
      <div>{children}</div>
    ),
}))
vi.mock('sanity/_dangerously_use_private_internals_that_do_not_follow_semver-1', () => ({
  useSchema: () => schema,
}))

vi.mock('sanity/router', () => ({
  useIntentLink: ({intent, params}: {intent: string; params: {id: string; type: string}}) => ({
    href: `/intent/${intent}/id=${params.id};type=${params.type}`,
    onClick: () => undefined,
  }),
}))

vi.mock('sanity/i18n', () => ({
  defineLocaleResourceBundle: (bundle: unknown) => bundle,
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) =>
      options ? `${key}:${JSON.stringify(options)}` : key,
  }),
}))

vi.mock('../../../hooks/useCopyToClipboard', () => ({
  useCopyToClipboard: () => vi.fn(async () => true),
}))

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

function renderParsed(result: unknown, datasetName = 'workspace-dataset') {
  renderList(parseDocumentList(result), datasetName)
}

function renderList(
  parsed: ParsedDocumentList,
  datasetName = 'workspace-dataset',
  resolvePreviews = false,
  action?: ReactNode,
) {
  render(
    <ThemeProvider theme={theme}>
      <LayerProvider>
        <DocumentListView
          datasetName={datasetName}
          id="vision-result-content"
          parsed={parsed}
          resolvePreviews={resolvePreviews}
          action={action}
        />
      </LayerProvider>
    </ThemeProvider>,
  )
}

afterEach(() => {
  cleanup()
  previews.clear()
})

describe('DocumentListView', () => {
  it('lists the result, including a row with no type and an unknown type', () => {
    renderParsed([
      {
        _id: 'ada',
        _type: 'author',
        title: 'Ada',
        subtitle: 'Writer',
        media: 'https://cdn.example/ada.png',
      },
      {_id: 'no-type', title: 'Untitled'},
      {_id: 'drafts.gadget', _type: 'gadget', media: {asset: {_ref: 'image-x'}}},
    ])

    const rows = screen.getAllByTestId('vision-document-list-row')
    expect(rows).toHaveLength(3)
    expect(rows[0].textContent).toContain('Ada')
    expect(rows[0].textContent).toContain('Writer')
    expect(rows[0].querySelector('[data-testid="preview"]')?.getAttribute('data-image')).toBe(
      'https://cdn.example/ada.png',
    )
    expect(
      screen.getAllByTestId('vision-document-list-link').map((link) => link.getAttribute('href')),
    ).toEqual(['/intent/edit/id=ada;type=author', '/intent/edit/id=gadget;type=gadget'])
    expect(rows[1].querySelector('a')).toBeNull()
    expect(rows[1].textContent).toContain('Untitled')
    expect(rows[1].querySelector('[data-testid="vision-document-list-open"]')).toBeNull()
    expect(rows[2].querySelector('[data-testid="preview"]')?.getAttribute('data-media')).toBe('yes')
    expect(rows[2].textContent).toContain('gadget')
  })

  it('does not link rows when the result is from another dataset', () => {
    renderParsed([{_id: 'ada', _type: 'author', title: 'Ada'}], 'other-dataset')

    const row = screen.getByTestId('vision-document-list-row')
    expect(row.textContent).toContain('Ada')
    expect(row.querySelector('a')).toBeNull()
    expect(screen.queryByTestId('vision-document-list-open')).toBeNull()
    expect(screen.getByTestId('vision-document-list-copy-id')).toBeTruthy()
  })

  it('lists the documents of a source map, linking only those in the workspace dataset', () => {
    renderList(
      parseSourceMapDocuments({
        documents: [
          {_id: 'ada', _type: 'author'},
          {
            _id: 'local',
            _type: 'author',
            _projectId: 'workspace-project',
            _dataset: 'workspace-dataset',
          },
          {_id: 'remote', _type: 'author', _projectId: 'other-project', _dataset: 'other-dataset'},
          {_id: 'sibling', _type: 'author', _dataset: 'other-dataset'},
        ],
      }),
    )

    const rows = screen.getAllByTestId('vision-document-list-row')
    expect(rows.map((row) => row.textContent)).toEqual([
      'ada',
      'localworkspace-project · workspace-dataset',
      'remoteother-project · other-dataset',
      'siblingother-dataset',
    ])
    expect(
      screen.getAllByTestId('vision-document-list-link').map((link) => link.getAttribute('href')),
    ).toEqual(['/intent/edit/id=ada;type=author', '/intent/edit/id=local;type=author'])
    expect(rows[2].querySelector('a')).toBeNull()
    expect(rows[3].querySelector('a')).toBeNull()
    expect(screen.getAllByTestId('vision-document-list-copy-id')).toHaveLength(4)
  })

  it('resolves schema previews for workspace rows, falling back to the id', () => {
    previews.set('drafts.ada', {title: 'Ada Lovelace', subtitle: 'Mathematician'})
    previews.set('versions.spring.untitled', {})
    renderList(
      parseSourceMapDocuments({
        documents: [
          {_id: 'drafts.ada', _type: 'author'},
          {_id: 'loading', _type: 'author'},
          {_id: 'versions.spring.untitled', _type: 'author'},
          {_id: 'unknown', _type: 'unknownType'},
          {_id: 'remote', _type: 'author', _projectId: 'other-project', _dataset: 'other-dataset'},
        ],
      }),
      'workspace-dataset',
      true,
    )

    expect(screen.getAllByTestId('vision-document-list-row').map((row) => row.textContent)).toEqual(
      [
        'Ada LovelaceMathematician',
        'loading',
        'versions.spring.untitled',
        'unknown',
        'remoteother-project · other-dataset',
      ],
    )
    expect(new Set(useValuePreview.mock.calls.map(([props]) => props.value._id))).toEqual(
      new Set(['drafts.ada', 'loading', 'versions.spring.untitled']),
    )
    const perspectives = new Map(
      useValuePreview.mock.calls.map(([props]) => [props.value._id, props.perspectiveStack]),
    )
    expect(Object.fromEntries(perspectives)).toEqual({
      'drafts.ada': ['drafts'],
      'loading': [],
      'versions.spring.untitled': ['spring'],
    })
  })

  it('does not resolve previews for a result from another dataset', () => {
    renderList(
      parseSourceMapDocuments({documents: [{_id: 'ada', _type: 'author'}]}),
      'other-dataset',
      true,
    )
    expect(screen.getByTestId('vision-document-list-row').textContent).toBe('ada')
    expect(useValuePreview).not.toHaveBeenCalled()
  })

  it('puts the panel id on the root so the tab can control it', () => {
    renderParsed([{_id: 'ada'}])
    expect(document.getElementById('vision-result-content')).toBeTruthy()
  })

  it('shows the empty state for an empty array', () => {
    renderParsed([])
    expect(screen.getByText('vision.result.documents.empty')).toBeTruthy()
    expect(screen.queryByTestId('command-list')).toBeNull()
    expect(screen.queryByText(DOCUMENT_LIST_SHAPE)).toBeNull()
  })

  it('explains a result that is not an array', () => {
    renderParsed({_id: 'ada'})
    expect(screen.getByText('vision.result.documents.invalid.not-array')).toBeTruthy()
    expect(screen.getByText(DOCUMENT_LIST_SHAPE)).toBeTruthy()
    expect(screen.queryByTestId('vision-document-list-row')).toBeNull()
  })

  it('explains how many items have no id', () => {
    renderParsed([{_id: 'ada'}, {_type: 'author', title: 'Nameless'}, null])
    expect(
      screen.getByText('vision.result.documents.invalid.missing-id:{"count":2,"total":3}'),
    ).toBeTruthy()
    expect(screen.getByText(DOCUMENT_LIST_SHAPE)).toBeTruthy()
    expect(screen.queryByTestId('vision-document-list-row')).toBeNull()
  })

  it('offers the action over the rows of a list', () => {
    renderList(parseDocumentList([{_id: 'ada'}]), undefined, false, <button>Fit</button>)
    expect(screen.getByRole('button', {name: 'Fit'})).toBeTruthy()
    expect(screen.getByTestId('command-list')).toBeTruthy()
  })

  it('offers the action under the expected shape of a result that is not a list', () => {
    renderList(parseDocumentList(42), undefined, false, <button>Fit</button>)
    expect(screen.getByRole('button', {name: 'Fit'})).toBeTruthy()
    expect(screen.getByText(DOCUMENT_LIST_SHAPE)).toBeTruthy()
  })

  it('offers no action for an empty list', () => {
    renderList(parseDocumentList([]), undefined, false, <button>Fit</button>)
    expect(screen.queryByRole('button', {name: 'Fit'})).toBeNull()
  })
})
