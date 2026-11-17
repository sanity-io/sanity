import {definePlugin} from '../../config/definePlugin'
import {type ProviderProps} from '../../config/studio/types'
import {SingleDocReleaseEnabledProvider} from '../context/SingleDocReleaseEnabledProvider'
import {SingleDocReleaseUpsellProvider} from '../context/SingleDocReleaseUpsellProvider'
import {singleDocReleaseUsEnglishLocaleBundle} from '../i18n'
import resolveDocumentActions from './documentActions'

/**
 * @internal
 */
export const SINGLE_DOC_RELEASE_NAME = 'sanity/singleDocRelease'

/**
 * @internal
 */
export const RELEASES_SCHEDULED_DRAFTS_INTENT = 'releases-scheduled-drafts'

/**
 * @internal
 */
export const singleDocRelease = definePlugin({
  name: SINGLE_DOC_RELEASE_NAME,
  studio: {
    components: {
      provider: SingleDocReleaseStudioProvider,
    },
  },
  i18n: {
    bundles: [singleDocReleaseUsEnglishLocaleBundle],
  },
  document: {
    actions: resolveDocumentActions,
  },
})

/** The single-doc release providers for the whole studio */
function SingleDocReleaseStudioProvider(props: ProviderProps) {
  return (
    <SingleDocReleaseEnabledProvider>
      <SingleDocReleaseUpsellProvider>{props.renderDefault(props)}</SingleDocReleaseUpsellProvider>
    </SingleDocReleaseEnabledProvider>
  )
}
