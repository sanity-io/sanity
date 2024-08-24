import {type SanityClient} from '@sanity/client'
import {map, mergeWith, type Observable, of, shareReplay, startWith, Subject, switchMap} from 'rxjs'

const API_VERSION = 'v2023-11-13'

interface Context {
  client: SanityClient
}

type AddonDatasetError = string

// TODO: Make client `never` when it isn't available (changes needed downstream).
type ClientStore =
  | {
      state: 'setupRequired'
      // client?: never
      client: null
      error?: never
    }
  | {
      state: 'initialising'
      // client?: never
      client: null
      error?: never
    }
  | {
      state: 'ready'
      client: SanityClient
      error?: never
    }
  | {
      state: 'error'
      // client?: never
      client: null
      error: AddonDatasetError
    }

/**
 * @internal
 */
export interface AddonDatasetStore {
  /**
   * Get a client instance for the addon dataset, always ensuring first that the addon dataset has
   * been created.
   *
   * TODO: `client$` will never be in state `setupRequired`.
   */
  client$: Observable<ClientStore>

  /**
   * Get a client instance for the addon dataset without automatically creating the addon dataset.
   */
  lazyClient$: Observable<ClientStore>
}

/**
 * @internal
 */
export function createAddonDatasetStore({client}: Context): AddonDatasetStore {
  const {dataset, projectId} = client.config()

  const newAddonDatasetName$ = new Subject<string>()

  // The response is an array containing the addon dataset. We only expect
  // one addon dataset to be returned, so we return the name of the first
  // addon dataset in the array.
  const addonDatasetName$: Observable<string | undefined> = newAddonDatasetName$
    .pipe(
      mergeWith(
        client
          .withConfig({
            apiVersion: API_VERSION,
          })
          .observable.request<{name?: string}[]>({
            uri: `/projects/${projectId}/datasets?datasetProfile=comments&addonFor=${dataset}`,
            tag: 'sanity.studio',
          })
          .pipe(map((response) => response?.[0]?.name)),
      ),
    )
    .pipe(shareReplay(1))

  const handleCreateClient = (addonDatasetName: string): Observable<ClientStore> => {
    return of<ClientStore>({
      state: 'ready',
      client: client.withConfig({
        apiVersion: API_VERSION,
        dataset: addonDatasetName,
        projectId,
        requestTagPrefix: 'sanity.studio',
        useCdn: false,
        withCredentials: true,
      }),
    })
  }

  const createAddonDataset$ = client.observable
    .withConfig({
      apiVersion: API_VERSION,
    })
    .request<{datasetName: string | null}>({
      uri: `/comments/${dataset}/setup`,
      method: 'POST',
    })
    .pipe(
      switchMap(({datasetName}) => {
        // 2. We can't continue if the addon dataset name is not returned
        if (!datasetName) {
          return of<ClientStore>({
            state: 'error',
            error: 'No addon dataset',
            client: null,
          })
        }
        // 3. Create a client for the addon dataset and set it in the context value
        //    so that the consumers can use it to execute comment operations and set up
        //    the real time listener for the addon dataset.
        newAddonDatasetName$.next(datasetName)
        return handleCreateClient(datasetName)
      }),
      shareReplay(1),
    )

  // TODO: Abstract duplicate code.
  const client$: Observable<ClientStore> = addonDatasetName$.pipe(
    switchMap<string | undefined, AddonDatasetStore['client$']>((addonDatasetName) => {
      if (typeof addonDatasetName === 'string') {
        return handleCreateClient(addonDatasetName)
      }

      return createAddonDataset$
    }),
    startWith<ClientStore>({
      state: 'initialising',
      client: null,
    }),
    shareReplay(1),
  )

  // TODO: Abstract duplicate code.
  const lazyClient$: Observable<ClientStore> = addonDatasetName$.pipe(
    switchMap<string | undefined, AddonDatasetStore['client$']>((addonDatasetName) => {
      if (typeof addonDatasetName === 'string') {
        return handleCreateClient(addonDatasetName)
      }

      return of<ClientStore>({
        state: 'setupRequired',
        client: null,
      })
    }),
    startWith<ClientStore>({
      state: 'initialising',
      client: null,
    }),
    shareReplay(1),
  )

  return {
    client$,
    lazyClient$,
  }
}

/**
 * @internal
 */
export function isClientStoreReady(
  clientStore: ClientStore,
): clientStore is ClientStore & {state: 'ready'} {
  return clientStore.state === 'ready'
}
