/**
 * Shared harness kit for the decomposed Vision tool stories
 * (`stories/tools/vision/*`). One place for the pieces every part page needs, so the
 * per-component files stay about the component:
 *
 *   - the `vision` i18n bundle registration (side effect on import — the Vision GUI
 *     reads its labels via `useTranslation('vision')`, and the shared Storybook i18next
 *     only ships the `studio`/`structure` bundles),
 *   - the mock schema + dataset name the Studio provider stack compiles against,
 *   - a bounded `ResultFrame` (the result pane is height-driven and collapses unbounded),
 *   - an `AuditNote` callout, and
 *   - a canned Content Lake-shaped GROQ syntax error.
 *
 * The Studio provider decorator + canned client live in each file's `meta` (each part
 * needs the same `WithStudioProviders({config, client})` pairing); this module keeps the
 * fixtures and i18n so they are declared exactly once.
 */
import {Card, Flex, Stack, Text} from '@sanity/ui'
import {type ReactNode} from 'react'

import visionLocaleResources from '../../../packages/@sanity/vision/src/i18n/resources'
import {i18next} from './i18n'

// Register the real Vision i18n bundle once, on first import of the kit. Deep-merge with
// overwrite so re-registration (HMR, multiple story files importing the kit) is a no-op.
i18next.addResourceBundle('en-US', 'vision', visionLocaleResources, true, true)

/** The dataset the mock workspace is configured with (matches `mockVisionClient`). */
export const VISION_DATASET = 'mock-data-set'

/**
 * The author/book schema the Vision result tree dereferences against — the same fixture
 * universe as `mockVisionClient.ts` and `mockDocumentPreviewStore.ts`.
 */
export const visionSchemaTypes = [
  {
    name: 'author',
    title: 'Author',
    type: 'document',
    fields: [
      {name: 'name', title: 'Name', type: 'string'},
      {name: 'era', title: 'Era', type: 'string'},
    ],
  },
  {
    name: 'book',
    title: 'Book',
    type: 'document',
    fields: [
      {name: 'title', title: 'Title', type: 'string'},
      {name: 'year', title: 'Year', type: 'number'},
      {name: 'author', title: 'Author', type: 'reference', to: [{type: 'author'}]},
    ],
  },
]

/**
 * A real GROQ syntax error shaped exactly like a Content Lake query error: `message`
 * plus a `details` object carrying the query text and the byte range of the fault. The
 * fault is on line 2 (empty right-hand operand before `]`), so `QueryErrorDetails`
 * computes a real line/column and draws its caret under the offending `]`.
 */
export const groqSyntaxError = Object.assign(
  new Error("Syntax error in GROQ query: expected expression, got ']'"),
  {
    details: {
      query: '*[_type == "book"\n  && ]{ title }\n',
      start: 23,
      end: 24,
    },
  },
)

/** A bounded, flex frame — the result pane is height-driven and collapses unbounded. */
export function ResultFrame(props: {height?: number; children: ReactNode}) {
  return (
    <Card
      border
      radius={2}
      overflow="hidden"
      style={{height: props.height ?? 460, display: 'flex'}}
    >
      <Flex direction="column" flex={1}>
        {props.children}
      </Flex>
    </Card>
  )
}

/** A small tone-coded callout for the audit notes that ride alongside a story. */
export function AuditNote(props: {
  tone?: 'caution' | 'critical' | 'positive'
  children: ReactNode
}) {
  return (
    <Card border padding={3} radius={2} tone={props.tone ?? 'caution'}>
      <Text size={1}>{props.children}</Text>
    </Card>
  )
}

/** A page-scoped stack wrapper with generous padding for the fullscreen layout. */
export function VisionStoryPage(props: {children: ReactNode}) {
  return (
    <Card padding={4} sizing="border" style={{minHeight: '100%'}}>
      <Stack gap={4} style={{maxWidth: 960, marginInline: 'auto'}}>
        {props.children}
      </Stack>
    </Card>
  )
}
