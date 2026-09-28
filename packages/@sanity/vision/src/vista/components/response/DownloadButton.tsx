import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType, useCallback} from 'react'

export interface DownloadButtonProps {
  /**
   * Builds the blob URL to download when the button is activated, so a result is only serialized
   * once someone asks for the file; the button is disabled while there is nothing to download
   */
  getBlobUrl: (() => string | undefined) | undefined
  /** Called when the file could not be built after all */
  onUnavailable?: () => void
  /** Suggested file name */
  download: string
  icon: ComponentType
  label: string
  /** Shown in the tooltip; defaults to the label */
  tooltip?: string
  testId: string
}

/** An icon button on the response action rail that downloads the result as a file */
export function DownloadButton({
  getBlobUrl,
  onUnavailable,
  download,
  icon,
  label,
  tooltip,
  testId,
}: DownloadButtonProps) {
  const handleClick = useCallback(() => {
    const url = getBlobUrl?.()
    if (!url) {
      onUnavailable?.()
      return
    }
    // A link created for the click, so the result is not serialized for a link nobody follows
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = download
    anchor.rel = 'noopener'
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
  }, [download, getBlobUrl, onUnavailable])

  return (
    <Tooltip content={<Text size={1}>{tooltip || label}</Text>} placement="left" portal>
      {/* A disabled button gets no pointer events, so the wrapper is what the tooltip listens to */}
      <span>
        <Button
          aria-label={label}
          data-testid={testId}
          disabled={getBlobUrl === undefined}
          icon={icon}
          mode="bleed"
          onClick={handleClick}
          padding={2}
        />
      </span>
    </Tooltip>
  )
}
