import {type ComponentType, type PropsWithChildren} from 'react'

import {DivergencesProvider} from '../../src/core/form/contexts/DivergencesProvider'

export const DivergencesTestProvider: ComponentType<PropsWithChildren> = ({children}) => {
  return <DivergencesProvider enabled={false}>{children}</DivergencesProvider>
}
