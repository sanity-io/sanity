import {GlobalStyle} from './GlobalStyle'
import {PreloadResources} from './PreloadResources'
import {StyledComponentsRegistry} from './registry'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <PreloadResources />
        <StyledComponentsRegistry>
          <GlobalStyle />
          {children}
        </StyledComponentsRegistry>
      </body>
    </html>
  )
}
