import {type Config, defineField, defineType} from 'sanity'
import {structureTool} from 'sanity/structure'

import {markRender} from '../components/benchRenderMark'
import {
  BenchPublishAction,
  BenchStructurePane,
  BenchTemplateBadge,
  ListenQueryPane,
  LoopBurstInput,
  ReferenceGridInput,
  StatusBarInput,
  TitleEchoInput,
} from '../components/customizations'

/**
 * The studio-customization test bed: one workspace per scenario (the same
 * convention as ../../sanity.config.ts), each hosting exactly one
 * customization pattern — custom previews, custom inputs, document
 * actions/badges, `S.component` panes — so a settle regression names its
 * pattern via the scenario, and the render marks name the component.
 * Included only by the customization build's config
 * (studio-customizations/sanity.config.ts, via
 * `pnpm --filter bench build:customizations`) — never by ../sanity.config.ts,
 * so the pristine dist every other mode measures is untouched.
 */

/** Referenced by previewHeavy and observed by both custom panes. */
const previewTarget = defineType({
  name: 'previewTarget',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'subtitle', type: 'string'}),
  ],
  components: {
    // Inline arrow, as the docs' form-components examples write it.
    preview: (props) => {
      markRender('previewHeavy.preview')
      return <div data-testid="bench-custom-preview">{props.renderDefault(props)}</div>
    },
  },
})

const previewHeavy = defineType({
  name: 'previewHeavy',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({
      name: 'refs',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'previewTarget'}]}],
      components: {input: ReferenceGridInput},
    }),
  ],
})

export const previewHeavyWorkspace = {
  name: 'preview-heavy-bench',
  plugins: [structureTool()],
  schema: {types: [previewTarget, previewHeavy]},
} satisfies Partial<Config>

const customInputs = defineType({
  name: 'customInputs',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'summary', type: 'string', components: {input: TitleEchoInput}}),
    defineField({name: 'status', type: 'string', components: {input: StatusBarInput}}),
  ],
})

export const customInputsWorkspace = {
  name: 'custom-inputs-bench',
  plugins: [structureTool()],
  schema: {types: [customInputs]},
} satisfies Partial<Config>

const documentActions = defineType({
  name: 'documentActions',
  type: 'document',
  fields: [defineField({name: 'title', type: 'string'})],
})

export const documentActionsWorkspace = {
  name: 'document-actions-bench',
  plugins: [structureTool()],
  document: {
    actions: (prev) => [...prev, BenchPublishAction],
    badges: (prev) => [...prev, BenchTemplateBadge],
  },
  schema: {types: [documentActions]},
} satisfies Partial<Config>

const debugLoop = defineType({
  name: 'debugLoop',
  type: 'document',
  fields: [
    defineField({name: 'title', type: 'string'}),
    defineField({name: 'burst', type: 'string', components: {input: LoopBurstInput}}),
  ],
})

export const debugLoopWorkspace = {
  name: 'debug-loop-bench',
  plugins: [structureTool()],
  schema: {types: [debugLoop]},
} satisfies Partial<Config>

export const structurePaneWorkspace = {
  name: 'structure-pane-bench',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Structure pane')
          .items([
            S.listItem()
              .id('bench-pane')
              .title('Bench custom pane')
              .child(S.component(BenchStructurePane).id('bench-pane').title('Bench custom pane')),
          ]),
    }),
  ],
  schema: {types: [previewTarget]},
} satisfies Partial<Config>

export const listenQueryPaneWorkspace = {
  name: 'listen-query-pane-bench',
  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Listen query pane')
          .items([
            S.listItem()
              .id('listen-query-pane')
              .title('Listen query pane')
              .child(
                S.component(ListenQueryPane).id('listen-query-pane').title('Listen query pane'),
              ),
          ]),
    }),
  ],
  schema: {types: [previewTarget]},
} satisfies Partial<Config>
