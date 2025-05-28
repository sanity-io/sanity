import {type SanityClient} from '@sanity/client'
import {type Schema} from '@sanity/types'
import {omit} from 'lodash'
import {asyncScheduler, type Observable} from 'rxjs'
import {distinctUntilChanged, map, shareReplay, throttleTime} from 'rxjs/operators'
import shallowEquals from 'shallow-equals'

import {type SourceClientOptions} from '../../../../config'
import {type LocaleSource} from '../../../../i18n'
import {type DraftsModelDocumentAvailability} from '../../../../preview'
import {validateDocumentWithReferences, type ValidationStatus} from '../../../../validation'
import {type DocumentStoreExtraOptions} from '../getPairListener'
import {type IdPair} from '../types'
import {memoize} from '../utils/createMemoizer'
import {editState} from './editState'
import {memoizeKeyGen} from './memoizeKeyGen'

// throttle delay for document updates (i.e. time between responding to changes in the current document)
const DOC_UPDATE_DELAY = 200

function shareLatestWithRefCount<T>() {
  return shareReplay<T>({bufferSize: 1, refCount: true})
}

/** @internal */
export const validation = memoize(
  (
    ctx: {
      client: SanityClient
      getClient: (options: SourceClientOptions) => SanityClient
      observeDocumentPairAvailability: (id: string) => Observable<DraftsModelDocumentAvailability>
      schema: Schema
      i18n: LocaleSource
      serverActionsEnabled: Observable<boolean>
      pairListenerOptions?: DocumentStoreExtraOptions
    },
    {draftId, publishedId, versionId}: IdPair,
    typeName: string,
  ): Observable<ValidationStatus> => {
    const document$ = editState(ctx, {draftId, publishedId, versionId}, typeName).pipe(
      map(({version, draft, published}) => version || draft || published),
      throttleTime(DOC_UPDATE_DELAY, asyncScheduler, {trailing: true}),
      distinctUntilChanged((prev, next) => {
        if (prev?._rev === next?._rev) {
          return true
        }
        // _rev and _updatedAt may change without other fields changing (due to a limitation in mutator)
        // so only pass on documents if _other_ attributes changes
        return shallowEquals(omit(prev, '_rev', '_updatedAt'), omit(next, '_rev', '_updatedAt'))
      }),
      shareLatestWithRefCount(),
    )

    return validateDocumentWithReferences(ctx, document$)
  },
  (ctx, idPair, typeName) => {
    return memoizeKeyGen(ctx.client, idPair, typeName)
  },
)
