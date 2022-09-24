/* eslint-disable import/export */
import React, {FC, ReactElement} from 'react'
import {render, RenderOptions} from '@testing-library/react'
import {LayerProvider, studioTheme, ThemeProvider} from '@sanity/ui'

const Providers: FC<{children?: React.ReactNode}> = ({children}) => {
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
