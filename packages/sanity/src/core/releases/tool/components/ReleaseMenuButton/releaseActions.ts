import {type DefinedTelemetryLog} from '@sanity/telemetry/react'
import {type ElementTone} from '@sanity/ui/theme'

import {
  ArchivedRelease,
  DeletedRelease,
  DuplicatedRelease,
  UnarchivedRelease,
  UnscheduledRelease,
} from '../../../__telemetry__/releases.telemetry'

export type ReleaseAction =
  | 'archive'
  | 'unarchive'
  | 'delete'
  | 'unschedule'
  | 'publish'
  | 'schedule'
  | 'duplicate'

interface BaseReleaseActionsMap {
  toastSuccessI18nKey?: string
  toastFailureI18nKey?: string
  telemetry: DefinedTelemetryLog<void>
}

interface DialogActionsMap extends BaseReleaseActionsMap {
  confirmDialog: {
    dialogId: string
    dialogHeaderI18nKey: string
    dialogDescriptionI18nKey: string
    dialogConfirmButtonI18nKey: string
    confirmButtonTone: ElementTone
  }
}

export const RELEASE_ACTION_MAP: Record<
  Exclude<ReleaseAction, 'schedule' | 'publish'>,
  DialogActionsMap | (BaseReleaseActionsMap & {confirmDialog: false})
> = {
  delete: {
    confirmDialog: {
      dialogId: 'confirm-delete-dialog',
      dialogHeaderI18nKey: 'delete-dialog.confirm-delete.header',
      dialogDescriptionI18nKey: 'delete-dialog.confirm-delete-description',
      dialogConfirmButtonI18nKey: 'delete-dialog.confirm-delete-button',
      confirmButtonTone: 'critical',
    },
    toastSuccessI18nKey: 'toast.delete.success',
    toastFailureI18nKey: 'toast.delete.error',
    telemetry: DeletedRelease,
  },
  archive: {
    confirmDialog: {
      dialogId: 'confirm-archive-dialog',
      dialogHeaderI18nKey: 'archive-dialog.confirm-archive-header',
      dialogDescriptionI18nKey: 'archive-dialog.confirm-archive-description',
      dialogConfirmButtonI18nKey: 'archive-dialog.confirm-archive-button',
      confirmButtonTone: 'critical',
    },
    toastFailureI18nKey: 'toast.archive.error',
    telemetry: ArchivedRelease,
  },
  unarchive: {
    confirmDialog: false,
    toastFailureI18nKey: 'toast.unarchive.error',
    telemetry: UnarchivedRelease,
  },
  unschedule: {
    confirmDialog: false,
    toastFailureI18nKey: 'toast.unschedule.error',
    telemetry: UnscheduledRelease,
  },
  duplicate: {
    confirmDialog: {
      dialogId: 'confirm-duplicate-dialog',
      dialogHeaderI18nKey: 'duplicate-dialog.confirm-duplicate-header',
      dialogDescriptionI18nKey: 'duplicate-dialog.confirm-duplicate-description',
      dialogConfirmButtonI18nKey: 'duplicate-dialog.confirm-duplicate-button',
      confirmButtonTone: 'primary',
    },
    toastSuccessI18nKey: 'toast.duplicate.success',
    toastFailureI18nKey: 'toast.duplicate.error',
    telemetry: DuplicatedRelease,
  },
}
