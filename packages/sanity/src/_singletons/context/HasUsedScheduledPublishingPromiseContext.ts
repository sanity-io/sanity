import {createContext} from 'sanity/_createContext'

/**
 * Whether the dataset has ever scheduled anything, as a promise for `use()`, provided by the
 * scheduled publishing plugin's studio provider. Settles once the usage probe has answered (at
 * once, as `true`, when the workspace opted in to scheduled publishing explicitly). `null` where
 * the plugin is not loaded; read it as `promise ? use(promise) : false`.
 * @internal
 */
export const HasUsedScheduledPublishingPromiseContext = createContext<Promise<boolean> | null>(
  'sanity/_singletons/context/has-used-scheduled-publishing-promise',
  null,
)
