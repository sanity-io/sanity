import {ChevronDownIcon} from '@sanity/icons/ChevronDown'
import {CopyIcon} from '@sanity/icons/Copy'
import {Button, Card, Text} from '@sanity/ui'
import {Menu, MenuButton, MenuItem} from '@sanity/ui/menu'
import {useToast} from '@sanity/ui/toast'
import {useId, useState} from 'react'
import {Flex} from 'ui5'

function useCopyToClipboard() {
  const toast = useToast()
  return (command: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard) {
      toast.push({status: 'error', title: 'Clipboard is not available'})
      return
    }
    void navigator.clipboard
      .writeText(command)
      .then(() => toast.push({status: 'success', title: 'Copied to clipboard'}))
      .catch((err: unknown) =>
        toast.push({
          status: 'error',
          title: 'Could not copy to clipboard',
          description: err instanceof Error ? err.message : String(err),
        }),
      )
  }
}

/**
 * Compact command chip (e.g. `git checkout <sha>`) with a copy button —
 * what you see is what gets copied.
 */
export function CommandChip(props: {command: string}) {
  const {command} = props
  const copy = useCopyToClipboard()
  return (
    <Card padding={1} paddingLeft={2} radius={2} tone="transparent" border>
      <Flex alignItems="center" gap={1}>
        <Text size={1} muted>
          <code>{command}</code>
        </Text>
        <Button
          mode="bleed"
          fontSize={0}
          padding={2}
          icon={CopyIcon}
          aria-label="Copy command to clipboard"
          onClick={() => copy(command)}
        />
      </Flex>
    </Card>
  )
}

function NpmLogo() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        fill="#CB3837"
        d="M1.763 0C.786 0 0 .786 0 1.763v20.474C0 23.214.786 24 1.763 24h20.474c.977 0 1.763-.786 1.763-1.763V1.763C24 .786 23.214 0 22.237 0zM5.13 5.323l13.837.019-.009 13.836h-3.464l.01-10.382h-3.456L12.04 19.17H5.113z"
      />
    </svg>
  )
}

function PnpmLogo() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
      <path
        fill="#F69220"
        d="M0 0v7.5h7.5V0zm8.25 0v7.5h7.5V0zM16.5 0v7.5H24V0zm0 8.25v7.5H24v-7.5zm-8.25 0v7.5h7.5v-7.5zm8.25 8.25V24H24v-7.5zm-8.25 0V24h7.5v-7.5zM0 16.5V24h7.5v-7.5z"
      />
    </svg>
  )
}

/**
 * Install command chip: the command for the selected package manager, a
 * compact logo dropdown to switch it (persisted per browser), and a copy
 * button that copies exactly what is shown.
 */
export function InstallChip(props: {version: string}) {
  const {version} = props
  const copy = useCopyToClipboard()
  const menuId = useId()
  const [pm, setPm] = useState<'npm' | 'pnpm'>(() =>
    typeof localStorage !== 'undefined' && localStorage.getItem('metricsBisectPm') === 'npm'
      ? 'npm'
      : 'pnpm',
  )
  const command = pm === 'pnpm' ? `pnpm add sanity@${version}` : `npm install sanity@${version}`
  const select = (next: 'npm' | 'pnpm') => {
    setPm(next)
    if (typeof localStorage !== 'undefined') localStorage.setItem('metricsBisectPm', next)
  }
  return (
    <Card padding={1} radius={2} tone="transparent" border>
      <Flex alignItems="center" gap={1}>
        <MenuButton
          id={menuId}
          button={
            <Button
              mode="bleed"
              fontSize={0}
              padding={2}
              icon={pm === 'pnpm' ? PnpmLogo : NpmLogo}
              iconRight={ChevronDownIcon}
              aria-label="Package manager"
            />
          }
          menu={
            <Menu>
              <MenuItem
                icon={PnpmLogo}
                text="pnpm"
                pressed={pm === 'pnpm'}
                onClick={() => select('pnpm')}
              />
              <MenuItem
                icon={NpmLogo}
                text="npm"
                pressed={pm === 'npm'}
                onClick={() => select('npm')}
              />
            </Menu>
          }
        />
        <Text size={1} muted>
          <code>{command}</code>
        </Text>
        <Button
          mode="bleed"
          fontSize={0}
          padding={2}
          icon={CopyIcon}
          aria-label="Copy install command to clipboard"
          onClick={() => copy(command)}
        />
      </Flex>
    </Card>
  )
}
