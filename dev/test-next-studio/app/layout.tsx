// eslint-disable-next-line import/no-unassigned-import
import './global.css'
import StyledComponentsRegistry from './registry'

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body>
        <StyledComponentsRegistry>{children}</StyledComponentsRegistry>
      </body>
    </html>
  )
}
