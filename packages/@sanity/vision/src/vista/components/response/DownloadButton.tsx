import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType, useCallback, useId} from 'react'
import {VisuallyHidden} from 'ui5'

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

  const unavailable = getBlobUrl === undefined
  const hintId = useId()

  return (
    <Tooltip content={<Text size={1}>{tooltip || label}</Text>} placement="left" portal>
      {/*
        A disabled button gets neither pointer events nor focus, so while the download is
        unavailable the wrapper stands in for it: the tooltip listens to the wrapper, and the
        wrapper takes the button's place in the tab order as a disabled button described by the
        tooltip's explanation, so a keyboard user can reach it too
      */}
      <span
        aria-describedby={unavailable && tooltip ? hintId : undefined}
        aria-disabled={unavailable || undefined}
        aria-label={unavailable ? label : undefined}
        role={unavailable ? 'button' : undefined}
        tabIndex={unavailable ? 0 : undefined}
      >
        <Button
          aria-hidden={unavailable || undefined}
          aria-label={label}
          data-testid={testId}
          disabled={unavailable}
          icon={icon}
          mode="bleed"
          onClick={handleClick}
          padding={2}
        />
        {unavailable && tooltip && <VisuallyHidden id={hintId}>{tooltip}</VisuallyHidden>}
      </span>
    </Tooltip>
  )
}
