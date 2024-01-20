/* eslint-disable import/export */

import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'
import {render, type RenderOptions} from '@testing-library/react'
import {type FC, type ReactElement, type ReactNode} from 'react'

const Providers: FC<{children?: ReactNode}> = ({children}) => {
  return (
    <ThemeProvider theme={studioTheme}>
      <LayerProvider>{children}</LayerProvider>
    </ThemeProvider>
  )
}

const customRender = (ui: ReactElement, options?: Omit<RenderOptions, 'wrapper'>) => {
  return render(ui, {wrapper: Providers, ...options})
}

export * from '@testing-library/react'

export {customRender as render}
