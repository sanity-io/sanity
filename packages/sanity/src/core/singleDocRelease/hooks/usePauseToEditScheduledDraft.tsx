import {type ReleaseDocument} from '@sanity/client'
import {useToast} from '@sanity/ui/toast'
import {useCallback, useState} from 'react'

import {useTranslation} from '../../i18n/hooks/useTranslation'
import {Translate} from '../../i18n/Translate'
import {getErrorMessage} from '../../util/getErrorMessage'
import {useScheduleDraftOperations} from './useScheduleDraftOperations'

export interface UsePauseToEditScheduledDraftOptions {
  release: ReleaseDocument | undefined
  documentTitle?: string
  onComplete?: () => void
}

export interface UsePauseToEditScheduledDraftValue {
  pauseToEdit: () => Promise<void>
  isPausing: boolean
}

/**
 * Hook that pauses a scheduled draft so it can be edited.
 *
 * @internal
 */
export function usePauseToEditScheduledDraft(
  options: UsePauseToEditScheduledDraftOptions,
): UsePauseToEditScheduledDraftValue {
  const {release, documentTitle, onComplete} = options

  const {t} = useTranslation()
  const toast = useToast()
  const operations = useScheduleDraftOperations()
  const [isPausing, setIsPausing] = useState(false)

  const pauseToEdit = useCallback(async () => {
    if (!release) return

    setIsPausing(true)
    // Workaround for React Compiler not yet fully supporting try/catch/finally syntax
    const run = async () => {
      await operations.pauseScheduledDraft(release)
      onComplete?.()
    }
    try {
      await run()
    } catch (error) {
      console.error('Failed to pause scheduled draft:', error)
      toast.push({
        closable: true,
        status: 'error',
        description: (
          <Translate
            t={t}
            i18nKey="release.toast.pause-scheduled-draft.error"
            values={{
              title: documentTitle || t('preview.default.title-fallback'),
              error: getErrorMessage(error),
            }}
          />
        ),
      })
    }
    setIsPausing(false)
  }, [release, operations, onComplete, toast, t, documentTitle])

  return {
    pauseToEdit,
    isPausing,
  }
}
