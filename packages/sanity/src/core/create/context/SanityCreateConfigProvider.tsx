import {type ReactNode, useMemo, useState} from 'react'
import {SanityCreateConfigContext} from 'sanity/_singletons'

import {useSource} from '../../studio'
import {CreateLinkedActions} from '../components/CreateLinkedActions'
import {CreateLinkedDocumentBannerContent} from '../components/CreateLinkedDocumentBannerContent'
import {StartInCreateBanner} from '../components/StartInCreateBanner'
import {createAppIdCache} from '../studio-app/appIdCache'
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

  const [appIdCache] = useState(() => createAppIdCache())

  const value = useMemo((): SanityCreateConfigContextValue => {
    return {
      ...beta?.create,
      startInCreateEnabled: !!beta?.create?.startInCreateEnabled,
      appIdCache,
      components: {
        documentLinkedBannerContent: CreateLinkedDocumentBannerContent,
        documentLinkedActions: CreateLinkedActions,
        startInCreateBanner: StartInCreateBanner,
      },
    }
  }, [beta?.create, appIdCache])

  return (
    <SanityCreateConfigContext.Provider value={value}>
      {children}
    </SanityCreateConfigContext.Provider>
  )
}
