import {route} from '@sanity/base/router'
import {legacyEditParamsToPath, legacyEditParamsToState, toPath, toState} from './helpers'

// http://localhost:3333/intent/create/template=book-by-author;type=book/eyJhdXRob3JJZCI6Imdycm0ifQ==

export const router = route('/', [
  // "Asynchronous intent resolving" route
  route.intents('/intent'),

  // Legacy fallback route, will be redirected to new format
  route('/edit/:type/:editDocumentId', [
    route({
      path: '/:params',
      transform: {params: {toState: legacyEditParamsToState, toPath: legacyEditParamsToPath}},
    }),
  ]),

  // The regular path - when the intent can be resolved to a specific pane
  route({
    path: '/:panes',
    // Legacy URLs, used to handle redirects
    children: [route('/:action', route('/:legacyEditDocumentId'))],
    transform: {
      panes: {toState, toPath},
    },
  }),
])
