import {type ReactNode, useMemo} from 'react'
import {SanityCreateConfigContext} from 'sanity/_singletons'

import {useSource} from '../../studio'
import {CreateLinkedActions} from '../components/CreateLinkedActions'
import {CreateLinkedDocumentBanner} from '../components/CreateLinkedDocumentBanner'
import {type SanityCreateConfigContextValue} from './useSanityCreateConfig'

interface SanityCreateConfigProviderProps {
  children: ReactNode
}

/**
 * @internal
 */
export function SanityCreateConfigProvider(props: SanityCreateConfigProviderProps): JSX.Element {
  const {children} = props
  const {beta} = useSource()
  const value = useMemo((): SanityCreateConfigContextValue => {
    return {
      ...beta?.create,
      startInCreateEnabled: !!beta?.create?.startInCreateEnabled,
      components: {
        documentLinkedBanner: CreateLinkedDocumentBanner,
        documentLinkedActions: CreateLinkedActions,
      },
    }
  }, [beta?.create])

  return (
    <SanityCreateConfigContext.Provider value={value}>
      {children}
    </SanityCreateConfigContext.Provider>
  )
}
