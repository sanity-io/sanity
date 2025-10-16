/
Read-only
Migration Guide: Sanity UI v3 -> v4
Installation

﻿
pnpm add @sanity/ui@4.0.0-static.36
pnpm add @sanity/ui@4.0.0-static.36

﻿
{
// ...
"dependencies": {
"@sanity/ui": "4.0.0-static.36",

    // peer dependencies of @sanity/ui
    "react": "^19",
    "react-dom": "^19",
    "react-is": "^19"

}
}  
{
// ...
"dependencies": {
"@sanity/ui": "4.0.0-static.36",

﻿
// peer dependencies of @sanity/ui
"react": "^19",
"react-dom": "^19",
"react-is": "^19"
}
}

﻿
Breaking changes
React v19+
Sanity UI v4 requires React v19+.
Import the CSS file
In the entry file of your application:

﻿
import '@sanity/ui/css/index.css'  
import '@sanity/ui/css/index.css'
New Root component
The new Root component replaces ThemeProvider.
This component is intended to render the <html> element.
It may also be used to render sections of a DOM document by using the as property.

﻿
<Root lang="en" scheme={scheme}>
...
</Root>
<Root lang="en" scheme={scheme}>
...
</Root>

﻿
theme replaced by vars
The theme property provided by styled-components is longer provided.
Instead, you may import the vars (strongly typed) object from @sanity/ui/css.

﻿
// v3

import {useTheme_v2} from '@sanity/ui'

function MyComponent() {
const theme = useTheme_v2()

return <div style={{color: theme.color.fg}} />
}

// v4

import {vars} from '@sanity/ui/css'

function MyComponent() {
return <div style={{color: vars.color.fg}} />
}
// v3

﻿
import {useTheme_v2} from '@sanity/ui'

﻿
function MyComponent() {
const theme = useTheme_v2()

﻿
return <div style={{color: theme.color.fg}} />
}

﻿
// v4

﻿
import {vars} from '@sanity/ui/css'

﻿
function MyComponent() {
return <div style={{color: vars.color.fg}} />
}

﻿
Deprecated CSS variables

﻿
`var(--card-backdrop-color)` => vars.color.backdrop
`var(--card-border-color)` => vars.color.border
`var(--card-bg-color)` => vars.color.bg
`var(--card-bg2-color)` => vars.color.muted.bg,
`var(--card-fg-color)` => vars.color.fg

// muted
`var(--card-muted-bg-color)` => vars.color.muted.bg
`var(--card-muted-fg-color)` => vars.color.muted.fg

// accent (deprecated in theme)
`var(--card-accent-fg-color)` => vars.color.tinted.suggest.fg[4]

// icon (deprecated in theme)
`var(--card-icon-color)` => vars.color.muted.fg

// link
`var(--card-link-fg-color)` => vars.color.link.fg

// avatar
`var(--card-avatar-${hue}-bg-color)` => vars.color.avatar[hue].bg
`var(--card-avatar-${hue}-fg-color)` => vars.color.avatar[hue].fg

// badge (deprecated in theme)
`var(--card-badge-${tone}-bg-color)` => vars.color.tinted[tone].bg[1]
`var(--card-badge-${tone}-dot-color)` => vars.color.tinted[tone].fg[4]
`var(--card-badge-${tone}-fg-color)` => vars.color.tinted[tone].fg[2]
`var(--card-badge-${tone}-icon-color)` => vars.color.tinted[tone].fg[4]

// code
`var(--card-code-bg-color)` => vars.color.code.bg,
`var(--card-code-fg-color)` => vars.color.code.fg,

// focus ring
`var(--card-focus-ring-color)` => vars.color.focusRing

// kbd (deprecated in theme)
`var(--card-kbd-bg-color)` => vars.color.muted.bg
`var(--card-kbd-border-color)` => vars.color.tinted.default.border[1]
`var(--card-kbd-fg-color)` => vars.color.muted.fg

// shadow
`var(--card-shadow-outline-color)` => vars.color.shadow.outline
`var(--card-shadow-umbra-color)` => vars.color.shadow.umbra
`var(--card-shadow-penumbra-color)` => vars.color.shadow.penumbra
`var(--card-shadow-ambient-color)` => vars.color.shadow.ambient

// skeleton
`var(--card-skeleton-from-color)` => vars.color.skeleton.from
`var(--card-skeleton-to-color)` => vars.color.skeleton.to,
`var(--card-backdrop-color)` => vars.color.backdrop
`var(--card-border-color)` => vars.color.border
`var(--card-bg-color)` => vars.color.bg
`var(--card-bg2-color)` => vars.color.muted.bg,
`var(--card-fg-color)` => vars.color.fg

﻿
// muted
`var(--card-muted-bg-color)` => vars.color.muted.bg
`var(--card-muted-fg-color)` => vars.color.muted.fg

﻿
// accent (deprecated in theme)
`var(--card-accent-fg-color)` => vars.color.tinted.suggest.fg[4]

﻿
// icon (deprecated in theme)
`var(--card-icon-color)` => vars.color.muted.fg

﻿
// link
`var(--card-link-fg-color)` => vars.color.link.fg

﻿
// avatar
`var(--card-avatar-${hue}-bg-color)` => vars.color.avatar[hue].bg
`var(--card-avatar-${hue}-fg-color)` => vars.color.avatar[hue].fg

﻿
// badge (deprecated in theme)
`var(--card-badge-${tone}-bg-color)` => vars.color.tinted[tone].bg[1]
`var(--card-badge-${tone}-dot-color)` => vars.color.tinted[tone].fg[4]
`var(--card-badge-${tone}-fg-color)` => vars.color.tinted[tone].fg[2]
`var(--card-badge-${tone}-icon-color)` => vars.color.tinted[tone].fg[4]

﻿
// code
`var(--card-code-bg-color)` => vars.color.code.bg,
`var(--card-code-fg-color)` => vars.color.code.fg,

﻿
// focus ring
`var(--card-focus-ring-color)` => vars.color.focusRing

﻿
// kbd (deprecated in theme)
`var(--card-kbd-bg-color)` => vars.color.muted.bg
`var(--card-kbd-border-color)` => vars.color.tinted.default.border[1]
`var(--card-kbd-fg-color)` => vars.color.muted.fg

﻿
// shadow
`var(--card-shadow-outline-color)` => vars.color.shadow.outline
`var(--card-shadow-umbra-color)` => vars.color.shadow.umbra
`var(--card-shadow-penumbra-color)` => vars.color.shadow.penumbra
`var(--card-shadow-ambient-color)` => vars.color.shadow.ambient

﻿
// skeleton
`var(--card-skeleton-from-color)` => vars.color.skeleton.from
`var(--card-skeleton-to-color)` => vars.color.skeleton.to,

﻿
The space property is renamed to gap throughout

﻿
// v3
<Button space={3} />
<Inline space={3} />
<Stack space={3} />

// v4
<Button gap={3} />
<Inline gap={3} />
<Stack gap={3} />
// v3
<Button space={3} />
<Inline space={3} />
<Stack space={3} />

﻿
// v4
<Button gap={3} />
<Inline gap={3} />
<Stack gap={3} />

﻿
Removed props

﻿
Code.muted // was not in use
Code.wrap // was not in use
Menu.open // was not in use
TextSkeleton.muted // was not in use
Code.muted // was not in use
Code.wrap // was not in use
Menu.open // was not in use
TextSkeleton.muted // was not in use

﻿
Renamed props

﻿
Button.space => Button.gap
Inline.space => Inline.gap
Stack.space => Stack.gap

Grid.columns => Grid.gridTemplateColumns  
Button.space => Button.gap
Inline.space => Inline.gap
Stack.space => Stack.gap

﻿
Grid.columns => Grid.gridTemplateColumns

﻿
Renamed exports

﻿
ThemeColorAvatarColorKey => AvatarColor
ThemeColorStateToneKey => ElementTone
ThemeFontWeightKey => FontWeight
BoxHeight => Height
BadgeTone => ElementTone
ButtonTone => ElementTone
ThemeColorAvatarColorKey => AvatarColor
ThemeColorStateToneKey => ElementTone
ThemeFontWeightKey => FontWeight
BoxHeight => Height
BadgeTone => ElementTone
ButtonTone => ElementTone

﻿
Removed exports

﻿
rem
rgba
useElementRect
rem
rgba
useElementRect

﻿

﻿

﻿
Using Sanity UI v4 in Next.js
See the example Next.js project here:
https://github.com/sanity-io/ui/tree/static/playground/next

﻿
CSS framework recommendation
Sanity UI developers recommend switching from styled-components to @vanilla-extract/css also internally in apps, but this is not a requirement to start migrating.

﻿
Recommended next.config.js configuration

﻿
import {createVanillaExtractPlugin} from '@vanilla-extract/next-plugin'

export const nextConfig = {
// ... your config ...

// Set a few headers which makes the app
// support server-side color scheme detection
async headers() {
return [
{
source: '/(.\*)',
headers: [
{
key: 'Accept-CH',
value: 'Sec-CH-Prefers-Color-Scheme',
},
{
key: 'Vary',
value: 'Sec-CH-Prefers-Color-Scheme',
},
{
key: 'Critical-CH',
value: 'Sec-CH-Prefers-Color-Scheme',
},
],
},
]
},
}

// Configure the Vanilla Extract plugin
const withVanillaExtract = createVanillaExtractPlugin()

// Export the config with the Vanilla Extract wrapper
export default withVanillaExtract(nextConfig)
import {createVanillaExtractPlugin} from '@vanilla-extract/next-plugin'

﻿
export const nextConfig = {
// ... your config ...

﻿
// Set a few headers which makes the app
// support server-side color scheme detection
async headers() {
return [
{
source: '/(.\*)',
headers: [
{
key: 'Accept-CH',
value: 'Sec-CH-Prefers-Color-Scheme',
},
{
key: 'Vary',
value: 'Sec-CH-Prefers-Color-Scheme',
},
{
key: 'Critical-CH',
value: 'Sec-CH-Prefers-Color-Scheme',
},
],
},
]
},
}

﻿
// Configure the Vanilla Extract plugin
const withVanillaExtract = createVanillaExtractPlugin()

﻿
// Export the config with the Vanilla Extract wrapper
export default withVanillaExtract(nextConfig)

﻿
Add a AppRoot component (server + client)
The AppRoot component is responsible for
importing the Sanity UI CSS file
rendering the Root component from @sanity/ui
transitioning betwen light and dark mode.

﻿
// app/components/AppRoot.tsx

'use client'

import '@sanity/ui/css/index.css'

import {Root, usePrefersDark} from '@sanity/ui'
import {type ColorScheme} from '@sanity/ui/theme'
import {useEffect, useRef, useState} from 'react'

export function AppRoot(props: {children: React.ReactNode; initialPrefersDark: boolean}) {
const {children, initialPrefersDark} = props

const prefersDark = usePrefersDark(() => initialPrefersDark)
const prefersDarkRef = useRef(prefersDark)
const [scheme, setScheme] = useState<ColorScheme>(() => (prefersDark ? 'dark' : 'light'))

useEffect(() => {
if (prefersDarkRef.current === prefersDark) return

    prefersDarkRef.current = prefersDark

    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setScheme(prefersDark ? 'dark' : 'light')
      })
      return
    }

    setScheme(prefersDark ? 'dark' : 'light')

}, [prefersDark])

return (
<Root lang="en" scheme={scheme}>
{children}
</Root>
)
}
// app/components/AppRoot.tsx

﻿
'use client'

﻿
import '@sanity/ui/css/index.css'

﻿
import {Root, usePrefersDark} from '@sanity/ui'
import {type ColorScheme} from '@sanity/ui/theme'
import {useEffect, useRef, useState} from 'react'

﻿
export function AppRoot(props: {children: React.ReactNode; initialPrefersDark: boolean}) {
const {children, initialPrefersDark} = props

﻿
const prefersDark = usePrefersDark(() => initialPrefersDark)
const prefersDarkRef = useRef(prefersDark)
const [scheme, setScheme] = useState<ColorScheme>(() => (prefersDark ? 'dark' : 'light'))

﻿
useEffect(() => {
if (prefersDarkRef.current === prefersDark) return

﻿
prefersDarkRef.current = prefersDark

﻿
if (document.startViewTransition) {
document.startViewTransition(() => {
setScheme(prefersDark ? 'dark' : 'light')
})
return
}

﻿
setScheme(prefersDark ? 'dark' : 'light')
}, [prefersDark])

﻿
return (
<Root lang="en" scheme={scheme}>
{children}
</Root>
)
}

﻿
app/layout.tsx
NOTE: it's recommended to NOT USE any normalizing CSS or other global CSS when using Sanity UI.
The most important parts to notice here:
the viewport configuration
fetching the Sec-CH-Prefers-Color-Scheme header value (only works if you added the headers configuration in next.config.js above)
wrapping the application in AppRoot

﻿
import {ColorScheme} from '@sanity/ui/theme'
import {headers} from 'next/headers'
import {AppRoot} from '../components/AppRoot'
import {Metadata, Viewport} from 'next'

// This is the recommended viewport configuration for apps using Sanity UI
export const viewport: Viewport = {
width: 'device-width',
initialScale: 1,
maximumScale: 1,
viewportFit: 'cover',
}

export const metadata: Metadata = {
title: 'App Name',
}

export default async function Layout({
children,
}: Readonly<{
children: React.ReactNode
}>) {
// Fetch the preferred color scheme on the server
const prefersColorScheme = (await headers()).get(
'Sec-CH-Prefers-Color-Scheme',
) as ColorScheme | null

// Wrap the application in the `AppRoot` component
return <AppRoot initialPrefersDark={prefersColorScheme === 'dark'}>{children}</AppRoot>
}

import {ColorScheme} from '@sanity/ui/theme'
import {headers} from 'next/headers'
import {AppRoot} from '../components/AppRoot'
import {Metadata, Viewport} from 'next'

﻿
// This is the recommended viewport configuration for apps using Sanity UI
export const viewport: Viewport = {
width: 'device-width',
initialScale: 1,
maximumScale: 1,
viewportFit: 'cover',
}

﻿
export const metadata: Metadata = {
title: 'App Name',
}

﻿
export default async function Layout({
children,
}: Readonly<{
children: React.ReactNode
}>) {
// Fetch the preferred color scheme on the server
const prefersColorScheme = (await headers()).get(
'Sec-CH-Prefers-Color-Scheme',
) as ColorScheme | null

﻿
// Wrap the application in the `AppRoot` component
return <AppRoot initialPrefersDark={prefersColorScheme === 'dark'}>{children}</AppRoot>
}

﻿
