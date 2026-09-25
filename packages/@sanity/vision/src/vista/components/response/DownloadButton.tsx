import {Button, Text} from '@sanity/ui'
import {Tooltip} from '@sanity/ui/tooltip'
import {type ComponentType} from 'react'

export interface DownloadButtonProps {
  /** The blob URL to download; the button is disabled while there is nothing to download */
  href: string | undefined
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
  href,
  download,
  icon,
  label,
  tooltip,
  testId,
}: DownloadButtonProps) {
  return (
    <Tooltip content={<Text size={1}>{tooltip || label}</Text>} placement="left" portal>
      {href ? (
        <Button
          aria-label={label}
          as="a"
          data-testid={testId}
          download={download}
          href={href}
          icon={icon}
          mode="bleed"
          padding={2}
        />
      ) : (
        // A disabled button gets no pointer events, so the wrapper is what the tooltip listens to
        <span>
          <Button
            aria-label={label}
            data-testid={testId}
            disabled
            icon={icon}
            mode="bleed"
            padding={2}
          />
        </span>
      )}
    </Tooltip>
  )
}
