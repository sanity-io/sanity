import {FaceHappyIcon, FaceIndifferentIcon, FaceSadIcon} from '@sanity/icons'
import {Card, Flex, Stack, Switch, Text, TextArea} from '@sanity/ui'
import {
  type ChangeEvent,
  type ClipboardEvent,
  useCallback,
  useContext,
  useId,
  useState,
} from 'react'
import {FeedbackContext} from 'sanity/_singletons'

import {Button, Dialog} from '../../../ui-components'
import {useTranslation} from '../../i18n'
import {sendFeedbackToSentry} from '../feedbackClient'
import {type Sentiment} from '../types'
import {ImageAttachment} from './ImageAttachment'

/** @internal */
export interface FeedbackDialogProps {
  onClose: () => void
  /** Sentry DSN to send feedback to.
   * Format: `https://[key]@[host]/[project-id]`
   */
  dsn: string
  /** Tracks the tag schema for this feedback source. Bump when tags or larger changes are made.
   * Similar to version in telemetry consent.
   */
  feedbackVersion: string
  /** Identifies where this feedback was triggered from (e.g. 'studio-help-menu'). */
  source: string
  /** Extra tags merged with base + dynamic tags. Can override defaults. */
  extraTags?: Record<string, string | number | boolean>
  /** Override the dialog title. */
  title?: string
  /** Override the sentiment question (e.g., 'How easy or difficult is PTE to use?'). */
  sentimentLabel?: string
  /** User's name. Overrides the value from FeedbackContext when provided. */
  userName?: string
  /** User's email. Overrides the value from FeedbackContext when provided. */
  userEmail?: string
  /** Called after feedback is submitted successfully. */
  onSuccess?: () => void
  /** Called when feedback submission fails. */
  onError?: (error: Error) => void
}

const SENTIMENTS: {value: Sentiment; icon: typeof FaceHappyIcon; labelKey: string}[] = [
  {value: 'happy', icon: FaceHappyIcon, labelKey: 'feedback.sentiment.happy'},
  {value: 'neutral', icon: FaceIndifferentIcon, labelKey: 'feedback.sentiment.neutral'},
  {value: 'unhappy', icon: FaceSadIcon, labelKey: 'feedback.sentiment.unhappy'},
]

const MAX_FILE_SIZE = 20 * 1024 * 1024 // 20 MB

/** @internal */
export function FeedbackDialog(props: FeedbackDialogProps) {
  const {
    onClose,
    dsn,
    feedbackVersion,
    source,
    extraTags,
    title: dialogTitle,
    sentimentLabel,
    userName: userNameProp,
    userEmail: userEmailProp,
    onSuccess,
    onError,
  } = props
  const dialogId = useId()
  const {t} = useTranslation()

  const {
    telemetryConsent,
    userName: contextUserName,
    userEmail: contextUserEmail,
    tags,
  } = useContext(FeedbackContext)
  const resolvedName = userNameProp ?? contextUserName
  const resolvedEmail = userEmailProp ?? contextUserEmail

  const [sentiment, setSentiment] = useState<Sentiment | null>(null)
  const [message, setMessage] = useState('')
  const [contactConsent, setContactConsent] = useState(false)
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [attachmentError, setAttachmentError] = useState<string | null>(null)
  const [showAttachment, setShowAttachment] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const handleMessageChange = useCallback((event: ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(event.currentTarget.value)
  }, [])

  const handleFiles = useCallback(
    (files: File[]) => {
      const img = files.find((f) => f.type.startsWith('image/'))
      if (!img) return
      if (img.size > MAX_FILE_SIZE) {
        setAttachmentError(t('feedback.attachment.error.size'))
        return
      }
      setAttachmentError(null)
      setImageFile(img)
    },
    [t],
  )

  const handleFilesOver = useCallback(() => setDragOver(true), [])
  const handleFilesOut = useCallback(() => setDragOver(false), [])

  const handlePaste = useCallback(
    (event: ClipboardEvent) => {
      const items = event.clipboardData?.items
      if (!items) return
      for (const item of Array.from(items)) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile()
          if (file) {
            if (file.size > MAX_FILE_SIZE) {
              setAttachmentError(t('feedback.attachment.error.size'))
            } else {
              setAttachmentError(null)
              setImageFile(file)
            }
            break
          }
        }
      }
    },
    [t],
  )

  const handleSubmit = useCallback(async () => {
    const finalMessage: string = message
      ? message.trim()
      : `The user submitted a ${sentiment} sentiment rating without additional comments.`
    if (!sentiment) return

    setSubmitting(true)
    try {
      const attachments: {filename: string; data: Uint8Array}[] = []
      if (imageFile) {
        const buffer = await imageFile.arrayBuffer()
        attachments.push({
          filename: imageFile.name,
          data: new Uint8Array(buffer),
        })
      }

      await sendFeedbackToSentry({
        dsn,
        feedbackVersion,
        telemetryConsent,
        name: resolvedName,
        email: resolvedEmail,
        message: finalMessage,
        source,
        tags: {
          ...tags,
          ...extraTags,
          sentiment,
          contactConsent: String(contactConsent),
        },
        attachments,
      })

      setSubmitting(false)
      if (onSuccess) onSuccess()
      onClose()
    } catch (err) {
      setSubmitting(false)
      if (onError) onError(err instanceof Error ? err : new Error(String(err)))
    }
  }, [
    dsn,
    feedbackVersion,
    telemetryConsent,
    resolvedName,
    resolvedEmail,
    tags,
    message,
    sentiment,
    imageFile,
    contactConsent,
    source,
    extraTags,
    onSuccess,
    onError,
    onClose,
  ])

  return (
    <Dialog
      id={dialogId}
      header={dialogTitle ?? t('feedback.dialog.title')}
      onClose={onClose}
      onClickOutside={onClose}
      width={1}
      padding={false}
    >
      <Card paddingX={4} paddingY={5} borderTop onPaste={handlePaste}>
        <Stack space={5}>
          {/* Sentiment */}
          <Stack space={2}>
            <Text size={1} weight="medium">
              {sentimentLabel ?? t('feedback.sentiment.label')}
            </Text>
            <Flex gap={2}>
              {SENTIMENTS.map((option) => {
                const Icon = option.icon
                const isSelected = sentiment === option.value
                return (
                  <Button
                    key={option.value}
                    mode={isSelected ? 'default' : 'bleed'}
                    tone={isSelected ? 'primary' : 'default'}
                    onClick={() => setSentiment(option.value)}
                    icon={Icon}
                    text={t(option.labelKey)}
                    style={{cursor: 'pointer'}}
                  />
                )
              })}
            </Flex>
          </Stack>

          {/* Message */}
          <Stack space={3}>
            <Text size={1} weight="medium">
              {t('feedback.message.label')}
            </Text>
            <TextArea
              fontSize={1}
              rows={4}
              value={message}
              onChange={handleMessageChange}
              placeholder={t('feedback.message.placeholder')}
            />

            {/* Image attachment */}
            <ImageAttachment
              imageFile={imageFile}
              showAttachment={showAttachment}
              dragOver={dragOver}
              error={attachmentError}
              onFiles={handleFiles}
              onFilesOver={handleFilesOver}
              onFilesOut={handleFilesOut}
              onRemove={() => {
                setImageFile(null)
                setAttachmentError(null)
              }}
              onExpand={() => setShowAttachment(true)}
            />
          </Stack>

          {(message.trim() || imageFile) && (resolvedName || resolvedEmail) && (
            <Stack space={4}>
              <Stack space={3} paddingRight={3}>
                <Text size={1} weight="medium">
                  {t('feedback.consent.label')}
                </Text>

                <Text size={1} muted>
                  {t('feedback.consent.disclaimer')}
                </Text>
              </Stack>
              <Flex align="center" gap={2}>
                <Switch
                  checked={contactConsent}
                  onChange={() => setContactConsent((prev) => !prev)}
                />

                <Text size={1} muted>
                  {contactConsent ? t('feedback.consent.yes') : t('feedback.consent.no')}
                </Text>
              </Flex>
            </Stack>
          )}
        </Stack>
      </Card>

      {/* Actions */}
      <Card padding={3} borderTop>
        <Flex gap={2} justify="flex-end">
          <Button mode="ghost" text={t('feedback.cancel')} onClick={onClose} />
          <Button
            tone="primary"
            text={t('feedback.submit')}
            onClick={handleSubmit}
            disabled={!sentiment || submitting}
            loading={submitting}
          />
        </Flex>
      </Card>
    </Dialog>
  )
}
