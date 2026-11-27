import {HelpCircleIcon} from '@sanity/icons/HelpCircle'
import {useClickOutsideEvent, useGlobalKeyDown, useLayer} from '@sanity/ui'
import {Popover, type PopoverProps} from '@sanity/ui/popover'
import {type ReactNode, useEffect, useId, useState} from 'react'
import {useTranslation} from 'sanity/i18n'
import {Link, PressArea, Text, VStack} from 'ui5'

import {visionLocaleNamespace} from '../../i18n'
import * as styles from './HelpPopover.module.css'
import * as themeStyles from './themeTokens.module.css'

const FALLBACK_PLACEMENTS: PopoverProps['fallbackPlacements'] = [
  'top-start',
  'bottom-end',
  'top-end',
]

export interface HelpPopoverProps {
  /** Names the help button for assistive technology, and heads the popover without a `title` */
  label: string
  /** The popover's heading */
  title?: string
  /** The explanation, one paragraph per entry */
  content?: string | readonly string[]
  /** More help after the paragraphs */
  children?: ReactNode
  /** Linked as "Read docs" at the bottom of the popover */
  docsUrl?: string
  placement?: PopoverProps['placement']
  testId?: string
}

/** Closes the popover on Escape or a click outside it, while it is the topmost layer */
function DismissOnOutsideOrEscape(props: {
  elements: () => HTMLElement[]
  onDismiss: (returnFocus: boolean) => void
  children: ReactNode
}) {
  const {elements, onDismiss, children} = props
  const {isTopLayer} = useLayer()
  useClickOutsideEvent(isTopLayer && (() => onDismiss(false)), elements)
  useGlobalKeyDown((event) => {
    if (isTopLayer && event.key === 'Escape') onDismiss(true)
  })
  return <>{children}</>
}

/**
 * A help button that opens its explanation in a popover: a heading, text that can be selected
 * and copied, and a "Read docs" link when there is a page about it
 */
export function HelpPopover(props: HelpPopoverProps) {
  const {label, title = label, content, children, docsUrl, placement = 'bottom-start'} = props
  const {testId} = props
  const {t} = useTranslation(visionLocaleNamespace)
  const [open, setOpen] = useState(false)
  const [button, setButton] = useState<HTMLButtonElement | null>(null)
  const [popover, setPopover] = useState<HTMLDivElement | null>(null)
  const [dialog, setDialog] = useState<HTMLDivElement | null>(null)
  const dialogId = useId()
  const titleId = useId()
  const paragraphs = content === undefined ? [] : typeof content === 'string' ? [content] : content

  useEffect(() => {
    if (open) dialog?.focus({preventScroll: true})
  }, [open, dialog])

  const dismiss = (returnFocus: boolean) => {
    setOpen(false)
    if (returnFocus) button?.focus()
  }

  return (
    <Popover
      animate
      className={themeStyles.themeTokens}
      content={
        <DismissOnOutsideOrEscape
          elements={() => [button, popover].filter((element) => element !== null)}
          onDismiss={dismiss}
        >
          <div
            aria-labelledby={titleId}
            className={styles.content}
            data-testid={testId ? `${testId}-content` : undefined}
            id={dialogId}
            ref={setDialog}
            role="dialog"
            tabIndex={-1}
          >
            <VStack gap={3}>
              <Text as="div" id={titleId} size={1} trim={true} weight="medium">
                {title}
              </Text>
              {paragraphs.map((paragraph) => (
                <Text as="p" key={paragraph} muted size={1} trim={true}>
                  {paragraph}
                </Text>
              ))}
              {children && <VStack gap={2}>{children}</VStack>}
              {docsUrl && (
                <Text as="div" size={1} trim={true}>
                  <Link
                    data-testid={testId ? `${testId}-docs` : undefined}
                    href={docsUrl}
                    openInNewTab
                    style={{color: 'var(--card-link-color)'}}
                    underlined={false}
                  >
                    {t('vision.help.read-docs')} &rarr;
                  </Link>
                </Text>
              )}
            </VStack>
          </div>
        </DismissOnOutsideOrEscape>
      }
      fallbackPlacements={FALLBACK_PLACEMENTS}
      open={open}
      padding={3}
      placement={placement}
      portal
      ref={setPopover}
    >
      <PressArea
        aria-controls={dialogId}
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={label}
        data-testid={testId}
        onClick={() => setOpen((wasOpen) => !wasOpen)}
        ref={setButton}
        type="button"
      >
        {/* Trimmed like the label beside it, so the button does not make its row taller */}
        <Text muted={!open} size={1} trim={true}>
          <HelpCircleIcon />
        </Text>
      </PressArea>
    </Popover>
  )
}
