/** Image and file inputs, like the JS studio's `ImageInput` and `FileInput`: upload a file by
 * picking, dropping or pasting it, or select an asset that is already in the dataset. */
import {DocumentIcon} from '@sanity/icons/Document'
import {EllipsisHorizontalIcon} from '@sanity/icons/EllipsisHorizontal'
import {ImageIcon} from '@sanity/icons/Image'
import {LaunchIcon} from '@sanity/icons/Launch'
import {SearchIcon} from '@sanity/icons/Search'
import {TrashIcon} from '@sanity/icons/Trash'
import {UploadIcon} from '@sanity/icons/Upload'
import {Box, Button, Card, Dialog, Flex, Spinner, Stack, Text, TextInput} from '@sanity/ui'
import {Menu, MenuDivider, MenuItem} from '@sanity/ui/menu'
import {Popover} from '@sanity/ui/popover'
import {type ClipboardEvent, type DragEvent, useEffect, useRef, useState} from 'react'

import {client, errorMessage} from '../client'
import {imageUrl, imageUrlWith} from '../previews'
import {toastError} from '../toasts'
import {useDismiss} from '../ui'
import {isObject, type JsonObject, sleep} from '../util'
import {child, op, patch, type Target, unsetValue, valueOf} from './target'

type AssetKind = 'image' | 'file'

interface AssetInfo {
  id: string
  filename?: string
  size?: number
  mimeType?: string
  url?: string
  dimensions?: [number, number]
}

const ASSET_PROJECTION = `{_id, originalFilename, size, mimeType, url, "dimensions": metadata.dimensions{width, height}}`

function parseAsset(value: unknown): AssetInfo | undefined {
  if (!isObject(value) || typeof value._id !== 'string') return undefined
  const text = (key: string) =>
    typeof value[key] === 'string' ? (value[key] as string) : undefined
  const dimensions = isObject(value.dimensions)
    ? value.dimensions
    : isObject(value.metadata) && isObject(value.metadata.dimensions)
      ? value.metadata.dimensions
      : undefined
  return {
    id: value._id,
    filename: text('originalFilename'),
    size: typeof value.size === 'number' ? value.size : undefined,
    mimeType: text('mimeType'),
    url: text('url'),
    dimensions:
      dimensions && typeof dimensions.width === 'number' && typeof dimensions.height === 'number'
        ? [dimensions.width, dimensions.height]
        : undefined,
  }
}

function assetName(info: AssetInfo): string {
  return info.filename ?? info.id
}

function formatBytes(bytes: number): string {
  const units = ['B', 'kB', 'MB', 'GB']
  let value = bytes
  let unit = 0
  while (value >= 1000 && unit < units.length - 1) {
    value /= 1000
    unit++
  }
  return unit === 0 ? `${value.toFixed(0)} ${units[unit]}` : `${value.toFixed(1)} ${units[unit]}`
}

function assetSummary(info: AssetInfo): string {
  const parts: string[] = []
  if (info.dimensions) parts.push(`${info.dimensions[0]}×${info.dimensions[1]}`)
  if (info.size !== undefined) parts.push(formatBytes(info.size))
  if (!info.dimensions && info.mimeType) parts.push(info.mimeType)
  return parts.join(' · ')
}

function assetRef(value: unknown): string | undefined {
  const asset = isObject(value) ? value.asset : undefined
  return isObject(asset) && typeof asset._ref === 'string' ? asset._ref : undefined
}

/** The fields an image or file value holds next to its asset; removing the asset keeps the
 * value only when other fields are filled in. */
const ASSET_FIELDS = new Set(['_type', '_key', 'asset', 'crop', 'hotspot', 'media'])

function setAsset(target: Target, typeName: string, id: string) {
  const value = valueOf(target)
  patch(target, [
    op.setIfMissing(target.path, {_type: typeName}),
    ...['crop', 'hotspot']
      .filter((field) => isObject(value) && value[field] !== undefined)
      .map((field) => op.unset(child(target, field).path)),
    op.set(child(target, 'asset').path, {_type: 'reference', _ref: id}),
  ])
}

function removeAsset(target: Target) {
  const value = valueOf(target)
  const hasFields = isObject(value) && Object.keys(value).some((key) => !ASSET_FIELDS.has(key))
  const last = target.path.at(-1)
  const inArray = typeof last === 'number' || typeof last === 'object'
  if (!hasFields && !inArray) {
    unsetValue(target)
    return
  }
  patch(
    target,
    ['asset', 'crop', 'hotspot']
      .filter((field) => isObject(value) && value[field] !== undefined)
      .map((field) => op.unset(child(target, field).path)),
  )
}

const CHECKERBOARD = {
  maxHeight: 200,
  backgroundColor: 'var(--card-muted-bg-color)',
  backgroundImage:
    'linear-gradient(45deg, var(--card-bg-color) 25%, transparent 25%), linear-gradient(-45deg, var(--card-bg-color) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, var(--card-bg-color) 75%), linear-gradient(-45deg, transparent 75%, var(--card-bg-color) 75%)',
  backgroundSize: '16px 16px',
  backgroundPosition: '0 0, 0 8px, 8px -8px, -8px 0',
}

function AssetMenu(props: {
  readOnly: boolean
  url?: string
  onPick: () => void
  onBrowse: () => void
  onRemove: () => void
}) {
  const [open, setOpen] = useState(false)
  const button = useRef<HTMLButtonElement>(null)
  const popover = useRef<HTMLDivElement>(null)
  useDismiss(
    open,
    () => setOpen(false),
    () => [button.current, popover.current],
  )
  const run = (action: () => void) => () => {
    setOpen(false)
    action()
  }
  const url = props.url
  return (
    <Popover
      ref={popover}
      open={open}
      portal
      placement="bottom-end"
      content={
        <Menu>
          <MenuItem
            text="Upload"
            icon={UploadIcon}
            disabled={props.readOnly}
            onClick={run(props.onPick)}
          />
          <MenuItem
            text="Select"
            icon={SearchIcon}
            disabled={props.readOnly}
            onClick={run(props.onBrowse)}
          />
          {url ? (
            <MenuItem
              text="Open in new tab"
              icon={LaunchIcon}
              onClick={run(() => window.open(url, '_blank'))}
            />
          ) : null}
          <MenuDivider />
          <MenuItem
            text="Remove"
            icon={TrashIcon}
            tone="critical"
            disabled={props.readOnly}
            onClick={run(props.onRemove)}
          />
        </Menu>
      }
    >
      <Button
        ref={button}
        mode="ghost"
        icon={EllipsisHorizontalIcon}
        padding={2}
        title="Options"
        onClick={() => setOpen(!open)}
      />
    </Popover>
  )
}

export function AssetInput(props: {
  target: Target
  kind: AssetKind
  typeName: string
  options: JsonObject | undefined
}) {
  const {target, kind, typeName} = props
  const readOnly = target.readOnly
  const accept =
    typeof props.options?.accept === 'string'
      ? props.options.accept
      : kind === 'image'
        ? 'image/*'
        : ''
  const current = assetRef(valueOf(target))
  const [info, setInfo] = useState<AssetInfo>()
  const [uploading, setUploading] = useState<string>()
  const [dragging, setDragging] = useState(false)
  const [browsing, setBrowsing] = useState(false)
  const fileInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!current || info?.id === current) return
    let cancelled = false
    client()
      .fetch(`*[_id == $id][0]${ASSET_PROJECTION}`, {id: current}, {tag: 'asset.get'})
      .then((result: unknown) => {
        if (!cancelled) setInfo(parseAsset(result))
      })
      .catch(() => {
        if (!cancelled) setInfo(undefined)
      })
    return () => {
      cancelled = true
    }
  }, [current, info?.id])

  const upload = async (file: File) => {
    if (kind === 'image' && !file.type.startsWith('image/')) {
      toastError("Can't upload this file here", `${file.name} isn't an image`)
      return
    }
    setUploading(file.name)
    try {
      const document = await client().assets.upload(kind, file, {
        filename: file.name,
        tag: 'asset.upload',
      })
      const asset = parseAsset(document)
      if (asset) {
        setAsset(target, typeName, asset.id)
        setInfo(asset)
      }
    } catch (error) {
      toastError('Upload failed', errorMessage(error))
    }
    setUploading(undefined)
  }
  const pick = () => fileInput.current?.click()
  const onDrop = (event: DragEvent) => {
    event.preventDefault()
    setDragging(false)
    if (readOnly) return
    const file = event.dataTransfer.files[0]
    if (file) void upload(file)
  }
  const onPaste = (event: ClipboardEvent) => {
    if (readOnly) return
    const file = event.clipboardData.files[0]
    if (file) {
      event.preventDefault()
      void upload(file)
    }
  }
  const noun = kind === 'image' ? 'image' : 'file'
  const shownInfo = info?.id === current ? info : undefined

  let body
  if (uploading) {
    body = (
      <Flex align="center" gap={3} style={{padding: '0.75rem'}}>
        <Spinner size={1} />
        <Text size={1} muted textOverflow="ellipsis">
          Uploading {uploading}…
        </Text>
      </Flex>
    )
  } else if (!current) {
    body = (
      <Flex align="center" gap={3} wrap="wrap" style={{padding: '0.75rem'}}>
        <Text size={1} muted>
          {kind === 'image' ? <ImageIcon /> : <DocumentIcon />}
        </Text>
        <Box flex={1}>
          <Text size={1} muted>
            {readOnly
              ? `No ${noun}`
              : dragging
                ? `Drop ${noun} to upload`
                : `Drag or paste ${noun} here`}
          </Text>
        </Box>
        {readOnly ? null : (
          <Flex gap={2}>
            <Button
              mode="ghost"
              icon={UploadIcon}
              text="Upload"
              fontSize={1}
              padding={2}
              onClick={pick}
            />
            <Button
              mode="ghost"
              icon={SearchIcon}
              text="Select"
              fontSize={1}
              padding={2}
              onClick={() => setBrowsing(true)}
            />
          </Flex>
        )}
      </Flex>
    )
  } else {
    const menu = (
      <AssetMenu
        readOnly={readOnly}
        url={shownInfo?.url}
        onPick={pick}
        onBrowse={() => setBrowsing(true)}
        onRemove={() => removeAsset(target)}
      />
    )
    if (kind === 'image') {
      const summary = shownInfo ? assetSummary(shownInfo) : ''
      const caption = shownInfo
        ? summary
          ? `${assetName(shownInfo)} · ${summary}`
          : assetName(shownInfo)
        : ''
      body = (
        <Stack gap={2}>
          <div
            style={{
              position: 'relative',
              overflow: 'hidden',
              borderRadius: 3,
              boxShadow: 'inset 0 0 0 1px var(--card-border-color)',
            }}
          >
            <Flex justify="center" style={CHECKERBOARD}>
              <img
                data-testid="asset-image"
                src={imageUrlWith(current, 'h=400&fit=max')}
                alt=""
                style={{display: 'block', maxWidth: '100%', maxHeight: 200, objectFit: 'contain'}}
              />
            </Flex>
            <Card
              radius={2}
              shadow={1}
              style={{position: 'absolute', top: '0.5rem', right: '0.5rem'}}
            >
              {menu}
            </Card>
          </div>
          <Text size={1} muted textOverflow="ellipsis">
            {caption}
          </Text>
        </Stack>
      )
    } else {
      body = (
        <Flex align="center" gap={3} style={{padding: '0.5rem 0.5rem 0.5rem 0.75rem'}}>
          <Text size={2} muted>
            <DocumentIcon />
          </Text>
          <Stack gap={2} style={{flex: 1, minWidth: 0}}>
            <Text size={1} weight="medium" textOverflow="ellipsis">
              {shownInfo ? assetName(shownInfo) : current}
            </Text>
            <Text size={1} muted textOverflow="ellipsis">
              {shownInfo ? assetSummary(shownInfo) : ''}
            </Text>
          </Stack>
          {menu}
        </Flex>
      )
    }
  }

  const framed = !(current && kind === 'image')
  return (
    <div
      data-ui="AssetInput"
      data-testid={kind === 'image' ? 'image-input' : 'file-input'}
      tabIndex={0}
      style={
        framed
          ? {
              border: `1px dashed ${dragging ? 'var(--card-focus-ring-color)' : 'var(--card-border-color)'}`,
              borderRadius: 3,
              outline: 'none',
            }
          : {outline: 'none'}
      }
      onDragOver={(event) => {
        event.preventDefault()
        if (!readOnly) setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onPaste={onPaste}
    >
      <input
        ref={fileInput}
        type="file"
        accept={accept}
        style={{display: 'none'}}
        onChange={(event) => {
          const file = event.currentTarget.files?.[0]
          if (file) void upload(file)
          event.currentTarget.value = ''
        }}
      />
      {body}
      {browsing ? (
        <AssetBrowser
          kind={kind}
          onSelect={(id) => {
            setBrowsing(false)
            setAsset(target, typeName, id)
          }}
          onClose={() => setBrowsing(false)}
        />
      ) : null}
    </div>
  )
}

/** The asset source dialog: the newest assets of a kind in the dataset, searchable by file name. */
function AssetBrowser(props: {
  kind: AssetKind
  onSelect: (id: string) => void
  onClose: () => void
}) {
  const {kind, onSelect} = props
  const [query, setQuery] = useState('')
  const [assets, setAssets] = useState<AssetInfo[]>()
  useEffect(() => {
    let cancelled = false
    const load = async () => {
      if (query) await sleep(250)
      if (cancelled) return
      try {
        const result: unknown = await client().fetch(
          `*[_type == $type && ($q == "" || originalFilename match $q)] | order(_createdAt desc)[0...60]${ASSET_PROJECTION}`,
          {
            type: kind === 'image' ? 'sanity.imageAsset' : 'sanity.fileAsset',
            q: query ? `${query}*` : '',
          },
          {tag: 'asset.list'},
        )
        if (cancelled) return
        setAssets(Array.isArray(result) ? result.flatMap((item) => parseAsset(item) ?? []) : [])
      } catch (error) {
        if (cancelled) return
        toastError('Could not load assets', errorMessage(error))
        setAssets([])
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [query, kind])

  let grid
  if (!assets) {
    grid = (
      <Flex justify="center" style={{padding: '2rem'}}>
        <Spinner />
      </Flex>
    )
  } else if (assets.length === 0) {
    grid = (
      <Box padding={4}>
        <Text size={1} muted align="center">
          No assets found
        </Text>
      </Box>
    )
  } else if (kind === 'image') {
    grid = (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(7.5rem, 1fr))',
          gap: '0.5rem',
        }}
      >
        {assets.map((asset) => (
          <Card
            key={asset.id}
            as="button"
            radius={2}
            border
            padding={1}
            title={assetName(asset)}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr)',
              alignContent: 'start',
              gap: '0.25rem',
              minWidth: 0,
              textAlign: 'left',
              cursor: 'pointer',
            }}
            onClick={() => onSelect(asset.id)}
          >
            <div
              style={{
                aspectRatio: 1,
                overflow: 'hidden',
                borderRadius: 2,
                backgroundColor: 'var(--card-muted-bg-color)',
              }}
            >
              <img
                data-testid="asset-option"
                src={imageUrl(asset.id, 240)}
                alt=""
                loading="lazy"
                style={{display: 'block', width: '100%', height: '100%', objectFit: 'cover'}}
              />
            </div>
            <Text size={0} muted textOverflow="ellipsis">
              {assetName(asset)}
            </Text>
          </Card>
        ))}
      </div>
    )
  } else {
    grid = (
      <Stack gap={1}>
        {assets.map((asset) => (
          <Card
            key={asset.id}
            as="button"
            radius={2}
            padding={2}
            style={{display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer'}}
            onClick={() => onSelect(asset.id)}
          >
            <Flex align="center" gap={3}>
              <Text size={1} muted>
                <DocumentIcon />
              </Text>
              <Box flex={1}>
                <Text size={1} textOverflow="ellipsis">
                  {assetName(asset)}
                </Text>
              </Box>
              <Text size={1} muted>
                {assetSummary(asset)}
              </Text>
            </Flex>
          </Card>
        ))}
      </Stack>
    )
  }
  return (
    <Dialog
      id="asset-browser"
      header={kind === 'image' ? 'Select image' : 'Select file'}
      width={2}
      onClose={props.onClose}
    >
      <Box padding={4}>
        <Stack gap={3}>
          <TextInput
            value={query}
            placeholder="Search by file name"
            icon={SearchIcon}
            autoFocus
            onChange={(event) => setQuery(event.currentTarget.value)}
          />
          {grid}
        </Stack>
      </Box>
    </Dialog>
  )
}
