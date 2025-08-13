import {type ReactNode, useMemo} from 'react'
import {SanityCreateConfigContext} from 'sanity/_singletons'

import {useSource} from '../../studio/source'
import {CreateLinkedActions} from '../components/CreateLinkedActions'
import {CreateLinkedDocumentBannerContent} from '../components/CreateLinkedDocumentBannerContent'
import {useAppIdCache} from '../studio-app/AppIdCacheProvider'
import {type SanityCreateConfigContextValue} from './useSanityCreateConfig'

interface SanityCreateConfigProviderProps {
  children: ReactNode
}

/**
 * @internal
 */
export function SanityCreateConfigProvider(
  props: SanityCreateConfigProviderProps,
): React.JSX.Element {
  const {children} = props
  const {beta} = useSource()

  const appIdCache = useAppIdCache()

  const value = useMemo((): SanityCreateConfigContextValue => {
    return {
      ...beta?.create,
      startInCreateEnabled: !!beta?.create?.startInCreateEnabled,
      appIdCache,
      components: {
        documentLinkedBannerContent: CreateLinkedDocumentBannerContent,
        documentLinkedActions: CreateLinkedActions,
      },
    }
  }, [beta?.create, appIdCache])

  return (
    <SanityCreateConfigContext.Provider value={value}>
      {children}
    </SanityCreateConfigContext.Provider>
  )
}
