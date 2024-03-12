import {definePlugin} from 'sanity'

import {commentsUsEnglishLocaleBundle} from '../i18n'
import {CommentsDocumentLayout} from './document-layout'
import {CommentsField} from './field'
import {CommentsInput} from './input'
import {commentsInspector} from './inspector'
import {CommentsStudioLayout} from './studio-layout'

interface CommentsPluginOptions {
  withAddonDatasetProvider?: boolean
}

export const comments = definePlugin<CommentsPluginOptions | void>((opts) => {
  const {withAddonDatasetProvider = true} = opts || {}

  return {
    name: 'sanity/structure/comments',

    document: {
      inspectors: [commentsInspector],
      components: {
        unstable_layout: CommentsDocumentLayout,
      },
    },

    form: {
      components: {
        field: CommentsField,
        input: CommentsInput,
      },
    },

    studio: {
      components: {
        layout: (props) => (
          <CommentsStudioLayout {...props} withAddonDatasetProvider={withAddonDatasetProvider} />
        ),
      },
    },

    i18n: {bundles: [commentsUsEnglishLocaleBundle]},
  }
})
