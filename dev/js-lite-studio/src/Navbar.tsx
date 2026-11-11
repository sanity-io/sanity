/** The studio navbar, laid out like `StudioNavbar` and the Rust studio's navbar. */
import {BoltIcon} from '@sanity/icons/Bolt'
import {DashboardIcon} from '@sanity/icons/Dashboard'
import {DesktopIcon} from '@sanity/icons/Desktop'
import {LaunchIcon} from '@sanity/icons/Launch'
import {LeaveIcon} from '@sanity/icons/Leave'
import {MasterDetailIcon} from '@sanity/icons/MasterDetail'
import {MoonIcon} from '@sanity/icons/Moon'
import {SearchIcon} from '@sanity/icons/Search'
import {SunIcon} from '@sanity/icons/Sun'
import {Avatar, Badge, Box, Button, Card, Flex, Stack, Text} from '@sanity/ui'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {type ReactElement, useState} from 'react'

import {commandOpen, perf, type Scheme, scheme, setScheme, systemScheme, user} from './app-state'
import {initials, logout} from './auth'
import {WORKSPACE_TITLE} from './config'
import {currentUserId, userHue} from './presence'
import {PerspectivePicker} from './releases'
import {status as cacheStatus, type CacheStatus} from './replica'
import {jsStudioHref, linkClick, perspective, route, routeHref, withPerspective} from './router'
import {useAtom} from './state'
import {connected, lastCommitMs, lastLoadMs, syncState} from './store'
import {POPOVER_ANCHOR, useDismiss} from './ui'

function formatMs(value: number | undefined): string {
  return value === undefined ? '–' : `${Math.round(value)} ms`
}

function megabytes(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`
}

function warmUp(status: CacheStatus): string {
  if (status.full && !status.warming) return 'stopped at the budget'
  if (status.warmedIn !== undefined) return `${(status.warmedIn / 1000).toFixed(1)} s`
  return status.warming ? 'warming…' : '–'
}

/** Chrome's `performance.memory`, the only heap figure a page can read without cross-origin
 * isolation. */
function jsHeap(): number | undefined {
  return (performance as {memory?: {usedJSHeapSize: number}}).memory?.usedJSHeapSize
}

/** Transfer and decoded size of the scripts and stylesheets this page loaded. */
function scriptSize(): [number, number] | undefined {
  const entries = performance.getEntriesByType('resource') as PerformanceResourceTiming[]
  const scripts = entries.filter((entry) => /\.(js|css)(\?|$)/.test(entry.name))
  if (scripts.length === 0) return undefined
  return scripts.reduce<[number, number]>(
    ([transfer, decoded], entry) => [
      transfer + entry.transferSize,
      decoded + entry.decodedBodySize,
    ],
    [0, 0],
  )
}

function PerfRow(props: {label: string; value: string}) {
  return (
    <Flex gap={3}>
      <Box flex={1}>
        <Text size={1} muted>
          {props.label}
        </Text>
      </Box>
      <Text size={1} weight="medium">
        {props.value}
      </Text>
    </Flex>
  )
}

function PerfPanel() {
  const auth = useAtom(perf.auth)
  const schemaAt = useAtom(perf.schema)
  const schemaCached = useAtom(perf.schemaCached)
  const interactive = useAtom(perf.interactive)
  const list = useAtom(perf.list)
  const listCached = useAtom(perf.listCached)
  const commit = useAtom(lastCommitMs)
  const load = useAtom(lastLoadMs)
  const cache = useAtom(cacheStatus)
  const heap = jsHeap()
  const size = scriptSize()
  return (
    <Stack gap={3} padding={4} style={{width: 280}}>
      <Text size={1} weight="semibold">
        Performance
      </Text>
      <Text size={1} muted>
        Milliseconds since navigation start, unless noted.
      </Text>
      <PerfRow label="Script ready" value={formatMs(perf.scriptReady)} />
      <PerfRow label="Session checked" value={formatMs(auth)} />
      <PerfRow
        label="Schema ready"
        value={`${formatMs(schemaAt)}${schemaCached ? ' (cached)' : ''}`}
      />
      <PerfRow label="Studio interactive" value={formatMs(interactive)} />
      <MenuDivider />
      <PerfRow
        label="Document list"
        value={`${formatMs(list)}${listCached ? ' (in memory)' : ''}`}
      />
      <PerfRow label="Document load (listener + snapshot)" value={formatMs(load)} />
      <PerfRow label="Last commit round trip" value={formatMs(commit)} />
      <MenuDivider />
      <Text size={1} weight="semibold">
        Document cache
      </Text>
      <PerfRow
        label="Documents"
        value={`${cache.docs.toLocaleString('en-US')} · ${cache.typesDone}/${cache.types} types`}
      />
      <PerfRow
        label="Held / budget"
        value={`${megabytes(cache.bytes)} / ${megabytes(cache.budget)}`}
      />
      <PerfRow label="As JSON" value={megabytes(cache.jsonBytes)} />
      <PerfRow label="Warm-up" value={warmUp(cache)} />
      <PerfRow
        label="Evicted / fetched on demand"
        value={`${cache.evictions.toLocaleString('en-US')} / ${cache.fetched.toLocaleString('en-US')}`}
      />
      {heap === undefined ? null : <PerfRow label="JS heap" value={megabytes(heap)} />}
      {size ? (
        <PerfRow
          label="JS + CSS size (transfer / decoded)"
          value={`${Math.round(size[0] / 1024)} / ${Math.round(size[1] / 1024)} kB`}
        />
      ) : null}
    </Stack>
  )
}

/** A navbar button with a popover that closes on a click outside or Escape. */
function PopoverButton(props: {
  content: ReactElement
  minWidth?: number
  children: (open: boolean, toggle: () => void) => ReactElement
}) {
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLElement | null>(null)
  const [popover, setPopover] = useState<HTMLElement | null>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button, popover],
  )
  return (
    <Popover
      open={open}
      placement="bottom-end"
      portal
      constrainSize
      content={
        <div style={props.minWidth ? {minWidth: props.minWidth} : undefined}>{props.content}</div>
      }
      ref={setPopover}
    >
      <span ref={setButton} style={POPOVER_ANCHOR}>
        {props.children(open, () => setOpen((value) => !value))}
      </span>
    </Popover>
  )
}

export function Navbar() {
  const isConnected = useAtom(connected)
  const sync = useAtom(syncState)
  const current = useAtom(route)
  useAtom(perspective)
  const dark = useAtom(scheme) === 'dark'
  const signedIn = useAtom(user)

  return (
    <Card borderBottom padding={2} style={{flex: 'none'}}>
      <Flex align="center" gap={2}>
        <Button
          as="a"
          mode="bleed"
          text={WORKSPACE_TITLE}
          icon={DashboardIcon}
          href={routeHref({})}
          onClick={linkClick({})}
        />
        <Badge tone="primary" title="Rendered by the JS-lite (React) studio">
          JS-lite
        </Badge>
        <Box paddingX={1}>
          <Button mode="bleed" text="Structure" icon={MasterDetailIcon} selected />
        </Box>
        <Flex flex={1} justify="center">
          <Button
            mode="ghost"
            icon={SearchIcon}
            text="Search"
            title="Search (Ctrl+K)"
            onClick={() => commandOpen.set(true)}
          />
        </Flex>
        <PerspectivePicker />
        {isConnected ? null : (
          <Badge tone="caution" title="The listener lost its connection and is reconnecting">
            Reconnecting
          </Badge>
        )}
        {sync === 'error' ? <Badge tone="critical">Unsaved changes</Badge> : null}
        <PopoverButton content={<PerfPanel />}>
          {(open, toggle) => (
            <Button
              mode="bleed"
              icon={BoltIcon}
              title="Performance"
              selected={open}
              onClick={toggle}
            />
          )}
        </PopoverButton>
        <Button
          as="a"
          mode="bleed"
          icon={LaunchIcon}
          text="JS studio"
          title="Open this view in the JavaScript studio"
          href={withPerspective(jsStudioHref(current))}
        />
        <Button
          mode="bleed"
          icon={dark ? SunIcon : MoonIcon}
          title={dark ? 'Use light mode' : 'Use dark mode'}
          onClick={() => setScheme(dark ? 'light' : 'dark')}
        />
        <PopoverButton content={<UserMenu />} minWidth={220}>
          {(open, toggle) => (
            <Card
              as="button"
              radius={6}
              padding={1}
              title="User menu"
              selected={open}
              onClick={toggle}
            >
              {signedIn ? (
                <Avatar
                  src={signedIn.image}
                  initials={initials(signedIn.name)}
                  color={userHue(signedIn.id, currentUserId())}
                />
              ) : null}
            </Card>
          )}
        </PopoverButton>
      </Flex>
    </Card>
  )
}

function UserMenu() {
  const signedIn = useAtom(user)
  const current = useAtom(scheme)
  const system = useAtom(systemScheme)
  const schemeItem = (label: string, icon: typeof SunIcon, value: Scheme | undefined) => (
    <MenuItem
      text={label}
      icon={icon}
      selected={value ? !system && current === value : system}
      onClick={() => setScheme(value)}
    />
  )
  return (
    <Menu>
      {signedIn ? (
        <Flex align="center" gap={2} padding={3}>
          <Avatar
            src={signedIn.image}
            initials={initials(signedIn.name)}
            color={userHue(signedIn.id, currentUserId())}
            size={1}
          />
          <Stack gap={2} flex={1}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {signedIn.name}
            </Text>
            {signedIn.email ? (
              <Text size={1} muted textOverflow="ellipsis">
                {signedIn.email}
              </Text>
            ) : null}
          </Stack>
        </Flex>
      ) : null}
      <MenuDivider />
      {schemeItem('System', DesktopIcon, undefined)}
      {schemeItem('Dark', MoonIcon, 'dark')}
      {schemeItem('Light', SunIcon, 'light')}
      <MenuDivider />
      <MenuItem text="Sign out" icon={LeaveIcon} onClick={() => void logout()} />
    </Menu>
  )
}
