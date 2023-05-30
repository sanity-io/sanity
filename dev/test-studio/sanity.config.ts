import {BookIcon, CopyIcon, PublishIcon, TrashIcon, UnpublishIcon} from '@sanity/icons'
import {visionTool} from '@sanity/vision'
import {OperationsAPI, defineConfig, definePlugin} from 'sanity'
import {deskTool} from 'sanity/desk'
import {muxInput} from 'sanity-plugin-mux-input'
import {theme as tailwindTheme} from 'https://themer.sanity.build/api/hues?preset=tw-cyan&default=64748b&primary=d946ef;lightest:fdf4ff;darkest:701a75&transparent=6b7180;darkest:111826&positive=43d675;400;lightest:f8fafc&caution=f59e09;300;lightest:fffbeb;darkest:783510&critical=f43f5e;lightest:fef1f2;darkest:881337&lightest=ffffff&darkest=0f172a'
import {googleMapsInput} from '@sanity/google-maps-input'
import {DocumentAction2} from 'packages/sanity/src/core/config/document/actions2'
import {Observable, tap} from 'rxjs'
import {uuid} from '@sanity/uuid'
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
import {Field, formComponentsPlugin, Input, Item, Preview} from './components/formComponents'
import {googleTheme} from './themes/google'
import {vercelTheme} from './themes/vercel'
import {GoogleLogo, TailwindLogo, VercelLogo} from './components/workspaceLogos'
import {customInspector} from './inspectors/custom'

const publishAction: DocumentAction2 = {
  name: 'publish',
  menuItem: ({loading, draft}) => {
    return {
      disabled: loading || !draft,
      icon: PublishIcon,
      title: 'Publish',
      tone: 'positive',
    }
  },
  onAction: ({onActionStart, onActionEnd, operations}) => {
    onActionStart()

    operations.publish.execute()

    onActionEnd()
  },
}

const deleteAction: DocumentAction2 = {
  name: 'delete',
  menuItem: ({loading, draft, published}) => {
    return {
      disabled: loading || (!draft && !published),
      icon: TrashIcon,
      title: 'Delete',
      tone: 'critical',
    }
  },
  onAction: ({onActionStart, onActionEnd, operations}) => {
    onActionStart()

    operations.delete.execute()

    onActionEnd()
  },
}

const duplicateAction: DocumentAction2 = {
  name: 'duplicate',
  context: 'menu',
  menuItem: ({loading, draft, published}) => {
    return {
      disabled: loading || (!draft && !published),
      icon: CopyIcon,
      title: 'Duplicate',
      tone: 'primary',
    }
  },
  onAction: ({onActionStart, onActionEnd, operations}) => {
    onActionStart()

    const newId = uuid()

    operations.duplicate.execute(newId)

    onActionEnd()
  },
}

const unpublishAction: DocumentAction2 = {
  name: 'unpublish',
  menuItem: ({loading, published}) => {
    return {
      disabled: loading || !published,
      icon: UnpublishIcon,
      title: 'Unpublish',
      tone: 'caution',
    }
  },
  onAction: ({onActionStart, onActionEnd, operations}) => {
    onActionStart()

    operations.unpublish.execute()

    onActionEnd()
  },
}

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
    actions2: [publishAction, deleteAction, duplicateAction, unpublishAction],
    inspectors: (prev, ctx) => {
      if (ctx.documentType === 'inspectorsTest') {
        return [customInspector, ...prev]
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
    // document: {
    //   actions2: (prev) => {
    //     console.log(prev)

    //     return prev.filter(v => v.name !== 'action')
    //   },
    // },
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
])
