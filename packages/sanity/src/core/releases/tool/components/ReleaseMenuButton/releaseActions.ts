import {type DefinedTelemetryLog} from '@sanity/telemetry/react'
import {type ButtonTone} from '@sanity/ui'

import {
  ArchivedRelease,
  DeletedRelease,
  UnarchivedRelease,
  UnscheduledRelease,
} from '../../../__telemetry__/releases.telemetry'

export type ReleaseAction = 'archive' | 'unarchive' | 'delete' | 'unschedule'

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
    confirmButtonTone: ButtonTone
  }
}

export const RELEASE_ACTION_MAP: Record<
  ReleaseAction,
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
}
