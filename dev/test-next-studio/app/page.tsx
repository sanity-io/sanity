import Link from 'next/link'

const links = [
  // appDir
  ['/app-defaults', '/app with defaults'],
  ['/app-scheme-system', '/app with `scheme` hardcoded to `system`'],
  ['/app-scheme-light', '/app with `scheme` hardcoded to `light`'],
  ['/app-scheme-dark', '/app with `scheme` hardcoded to `dark`'],
  ['/app-global-styles', '/app with `unstable_globalStyles`'],
  ['/app-no-auth-boundary', '/app with `unstable_noAuthBoundary`'],
  // good old pages
  ['/pages-defaults', '/pages with defaults'],
  ['/pages-scheme-system', '/pages with `scheme` hardcoded to `system`'],
  ['/pages-scheme-light', '/pages with `scheme` hardcoded to `light`'],
  ['/pages-scheme-dark', '/pages with `scheme` hardcoded to `dark`'],
  ['/pages-global-styles', '/pages with `unstable_globalStyles`'],
  ['/pages-no-auth-boundary', '/pages with `unstable_noAuthBoundary`'],
]

export default function Page() {
  return (
    <div
      style={{
        display: 'flex',
        height: '100vh',
        maxHeight: '100dvh',
        width: '100vw',
        maxWidth: '100dvw',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <ul>
        {links.map(([href, text]) => (
          <li key={href}>
            <Link href={href}>{text}</Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
