import {BookIcon, CheckmarkCircleIcon, CircleIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {defineConfig, definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {muxInput} from 'sanity-plugin-mux-input'
import {assist} from '@sanity/assist'
import {googleMapsInput} from '@sanity/google-maps-input'
// eslint-disable-next-line import/no-extraneous-dependencies
import {tsdoc} from '@sanity/tsdoc/studio'
import {theme as tailwindTheme} from './sanity.theme.mjs'
import {imageAssetSource} from './assetSources'
import {Branding} from './components/Branding'
import {resolveDocumentActions as documentActions} from './documentActions'
import {resolveInitialValueTemplates} from './initialValueTemplates'
import {languageFilter} from './plugins/language-filter'
import {schemaTypes} from './schema'
import {defaultDocumentNode, newDocumentOptions, structure} from './structure'
import {workshopTool} from './workshop'
import {presenceTool} from './plugins/presence'
import {
  CustomLayout,
  CustomLogo,
  CustomNavbar,
  CustomToolMenu,
  studioComponentsPlugin,
} from './components/studioComponents'
import {
  Annotation,
  Block,
  Field,
  formComponentsPlugin,
  InlineBlock,
  Input,
  Item,
  Preview,
} from './components/formComponents'
import {googleTheme} from './themes/google'
import {vercelTheme} from './themes/vercel'
import {GoogleLogo, TailwindLogo, VercelLogo} from './components/workspaceLogos'
import {copyAction} from './fieldActions/copyAction'
import {assistFieldActionGroup} from './fieldActions/assistFieldActionGroup'
import {customInspector} from './inspectors/custom'
import {pasteAction} from './fieldActions/pasteAction'

const sharedSettings = definePlugin({
  name: 'sharedSettings',
  schema: {
    types: schemaTypes,
    templates: resolveInitialValueTemplates,
  },
  form: {
    image: {
      assetSources: [imageAssetSource],
    },
  },
  studio: {
    components: {
      logo: Branding,
    },
  },
  document: {
    actions: documentActions,
    inspectors: (prev, ctx) => {
      if (ctx.documentType === 'inspectorsTest') {
        return [customInspector, ...prev]
      }

      return prev
    },
    unstable_fieldActions: (prev, ctx) => {
      if (['fieldActionsTest', 'stringsTest'].includes(ctx.documentType)) {
        return [...prev, assistFieldActionGroup, copyAction, pasteAction]
      }

      return prev
    },
    newDocumentOptions,
  },
  plugins: [
    deskTool({
      icon: BookIcon,
      name: 'content',
      title: 'Content',
      structure,
      defaultDocumentNode,
    }),
    languageFilter({
      defaultLanguages: ['nb'],
      supportedLanguages: [
        {id: 'ar', title: 'Arabic'},
        {id: 'en', title: 'English'},
        {id: 'nb', title: 'Norwegian (bokmål)'},
        {id: 'nn', title: 'Norwegian (nynorsk)'},
        {id: 'pt', title: 'Portuguese'},
        {id: 'es', title: 'Spanish'},
      ],
      types: ['languageFilterDebug'],
    }),
    googleMapsInput({
      apiKey: 'AIzaSyDDO2FFi5wXaQdk88S1pQUa70bRtWuMhkI',
      defaultZoom: 11,
      defaultLocation: {
        lat: 40.7058254,
        lng: -74.1180863,
      },
    }),
    workshopTool({
      collections: [
        {name: 'sanity', title: 'sanity'},
        {name: 'default-layout', title: '@sanity/default-layout'},
        {name: 'desk-tool', title: '@sanity/desk-tool'},
        {name: 'form-builder', title: '@sanity/form-builder'},
      ],
    }),
    visionTool({
      defaultApiVersion: '2022-08-08',
    }),
    // eslint-disable-next-line camelcase
    muxInput({mp4_support: 'standard'}),
    presenceTool(),
    tsdoc(),
  ],
})

export default defineConfig([
  {
    name: 'default',
    title: 'Test Studio',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/test',
  },
  // Temporary comments (metacontent) workspace
  {
    name: 'default-metacontent-comments',
    title: 'Comments (metacontent)',
    projectId: 'ppsg7ml5',
    dataset: 'test-metacontent-comments',
    plugins: [deskTool(), visionTool()],
    schema: {
      types: [
        {
          name: 'comment',
          type: 'document',
          title: 'Comment',
          fields: [
            {
              name: 'threadId',
              title: 'Thread ID',
              type: 'string',
            },
            {
              name: 'parentCommentId',
              title: 'Parent comment ID',
              type: 'string',
            },
            {
              name: 'authorId',
              title: 'Author ID',
              type: 'string',
            },
            {
              name: 'editedAt',
              title: 'Last edited',
              type: 'date',
            },
            {
              name: 'message',
              title: 'Message',
              type: 'array',
              of: [
                {
                  type: 'block',
                  marks: {
                    annotations: [
                      {
                        name: 'mention',
                        type: 'object',
                        title: 'Mention',
                        fields: [
                          {
                            name: 'userId',
                            type: 'string',
                          },
                        ],
                      },
                    ],
                  },
                },
              ],
            },
            {
              name: 'status',
              title: 'Status',
              type: 'string',
              options: {
                layout: 'radio',
                list: ['open', 'resolved'],
              },
            },
            {
              name: 'workspace',
              title: 'Workspace',
              type: 'string',
            },
            {
              name: 'target',
              title: 'Target',
              type: 'object',
              fields: [
                {
                  name: 'documentId',
                  title: 'Document ID',
                  type: 'string',
                  readOnly: true,
                },
                {
                  name: 'documentType',
                  title: 'Document type',
                  type: 'string',
                  readOnly: true,
                },
                {
                  name: 'path',
                  title: 'Path',
                  type: 'object',
                  fields: [
                    {
                      name: 'field',
                      title: 'Field',
                      type: 'string',
                    },
                  ],
                },
              ],
              options: {
                collapsible: true,
              },
            },
            {
              name: 'context',
              title: 'Context',
              type: 'object',
              fields: [
                {
                  name: 'type',
                  title: 'Type',
                  type: 'string',
                },
                {
                  name: 'name',
                  title: 'Name',
                  type: 'string',
                },
              ],
              options: {
                collapsible: true,
              },
            },
            {
              name: 'notification',
              title: 'Notification',
              type: 'object',
              fields: [
                {
                  name: 'title',
                  title: 'Title',
                  type: 'string',
                },
                {
                  name: 'url',
                  title: 'URL',
                  type: 'string',
                },
              ],
              options: {
                collapsible: true,
              },
            },
          ],
          preview: {
            select: {
              id: '_id',
              status: 'status',
              threadId: 'threadId',
            },
            prepare({id, status, threadId}) {
              return {
                media: status === 'resolved' ? CheckmarkCircleIcon : CircleIcon,
                subtitle: `Comment: ${id}`,
                title: `Thread: ${threadId}`,
              }
            },
          },
        },
      ],
    },
    basePath: '/test-metacontent-comments',
  },
  {
    name: 'tsdoc',
    title: 'tsdoc',
    projectId: 'ppsg7ml5',
    dataset: 'tsdoc-2',
    plugins: [sharedSettings()],
    basePath: '/tsdoc',
  },
  {
    name: 'playground',
    title: 'Test Studio',
    subtitle: 'Playground dataset',
    projectId: 'ppsg7ml5',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/playground',
  },
  {
    name: 'staging',
    title: 'Staging',
    subtitle: 'Staging dataset',
    projectId: 'exx11uqh',
    dataset: 'playground',
    plugins: [sharedSettings()],
    basePath: '/staging',
    apiHost: 'https://api.sanity.work',
    auth: {
      loginMethod: 'token',
    },
  },
  {
    name: 'custom-components',
    title: 'Test Studio',
    subtitle: 'Components API playground',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings(), studioComponentsPlugin(), formComponentsPlugin()],
    basePath: '/custom-components',
    form: {
      components: {
        input: Input,
        field: Field,
        item: Item,
        preview: Preview,
        block: Block,
        inlineBlock: InlineBlock,
        annotation: Annotation,
      },
    },
    studio: {
      components: {
        layout: CustomLayout,
        logo: CustomLogo,
        navbar: CustomNavbar,
        toolMenu: CustomToolMenu,
      },
    },
  },
  {
    name: 'google-theme',
    title: 'Google Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/google',
    theme: googleTheme,
    icon: GoogleLogo,
  },
  {
    name: 'vercel-theme',
    title: 'Vercel Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/vercel',
    theme: vercelTheme,
    icon: VercelLogo,
  },
  {
    name: 'tailwind-theme',
    title: 'Tailwind Colors',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings()],
    basePath: '/tailwind',
    theme: tailwindTheme,
    icon: TailwindLogo,
  },
  {
    name: 'ai-assist',
    title: 'Sanity AI Assist',
    projectId: 'ppsg7ml5',
    dataset: 'test',
    plugins: [sharedSettings(), assist()],
    basePath: '/ai-assist',
  },
])
