import {
  type AssetSourceUploader,
  type AssetSourceUploadEvent,
  type AssetSourceUploadFile,
  type AssetSourceUploadSubscriber,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'

const DEFERRED_TERMINAL_STATUSES = ['complete', 'alreadyExists'] as const

export class MediaLibraryUploader implements AssetSourceUploader {
  private files: AssetSourceUploadFile[] = []
  private subscribers = new Set<AssetSourceUploadSubscriber>()
  private deferredUpdates = new Map<string, {status: string; progress?: number; error?: Error}>()

  private checkAllComplete(): void {
    const isDone =
      this.files.length > 0 &&
      this.files.every((file) =>
        ['complete', 'error', 'aborted', 'alreadyExists'].includes(file.status),
      )
    if (isDone) {
      const hasError = this.files.some((file) => file.status === 'error')
      if (hasError) {
        this.emit({
          type: 'error',
          files: this.files.filter((file) => file.status === 'error'),
        })
      }
      this.emit({type: 'all-complete', files: this.files})
      this.reset()
    }
  }

  private emit(event: AssetSourceUploadEvent): void {
    this.subscribers.forEach((fn) => fn(event))
  }

  /**
   * Emit all-complete after applying any deferred terminal status updates.
   * Call this when uploadResponse is received so all-complete fires after the
   * asset source has the data it needs, avoiding unmount before postMessage arrives.
   */
  signalCompletion(): void {
    this.deferredUpdates.forEach(({status, progress, error}, fileId) => {
      const target = this.files.find((f) => f.id === fileId)
      if (target) {
        if (error) target.error = error
        if (progress !== undefined) target.progress = progress
        target.status = status as AssetSourceUploadFile['status']
      }
    })
    this.deferredUpdates.clear()
    this.checkAllComplete()
  }

  upload(files: globalThis.File[]): AssetSourceUploadFile[] {
    for (const file of files) {
      const uploadFile: AssetSourceUploadFile = {
        id: uuid(),
        file,
        progress: 0,
        status: 'pending',
      }
      this.files.push(uploadFile)
    }
    return this.files
  }

  abort(file?: AssetSourceUploadFile): void {
    if (file) {
      const target = this.files.find((f) => f.id === file.id)
      if (target && ['pending', 'uploading'].includes(target.status)) {
        this.updateFile(target.id, {status: 'aborted'})
      }
    } else {
      for (const target of this.files) {
        if (['pending', 'uploading'].includes(target.status)) {
          this.updateFile(target.id, {status: 'aborted'})
        }
      }
    }
    this.emit({
      type: 'abort',
      files: this.files.filter((abortedFile) => abortedFile.status === 'aborted'),
    })
    this.checkAllComplete()
  }
  updateFile(fileId: string, data: {progress?: number; status?: string; error?: Error}): void {
    const target = this.files.find((f) => f.id === fileId)
    if (!target) return

    if (data.error) target.error = data.error
    if (data.progress !== undefined && data.progress !== target.progress) {
      target.progress = data.progress
      this.emit({type: 'progress', file: target, progress: target.progress * 100})
    }
    if (data.status && data.status !== target.status) {
      if (
        DEFERRED_TERMINAL_STATUSES.includes(
          data.status as (typeof DEFERRED_TERMINAL_STATUSES)[number],
        )
      ) {
        this.deferredUpdates.set(fileId, {
          status: data.status,
          progress: data.progress,
          error: data.error,
        })
        return
      }
      target.status = data.status as AssetSourceUploadFile['status']
      this.emit({type: 'status', file: target, status: target.status})
    }
    this.checkAllComplete()
  }

  subscribe(subscriber: AssetSourceUploadSubscriber): () => void {
    this.subscribers.add(subscriber)

    // Emit current state for all files for new subscribers
    for (const file of this.files) {
      subscriber({type: 'status', file, status: file.status})
      subscriber({type: 'progress', file, progress: file.progress})
    }
    this.checkAllComplete()

    return () => {
      this.subscribers.delete(subscriber)
    }
  }

  getFiles(): AssetSourceUploadFile[] {
    return this.files
  }

  reset(): void {
    this.files = []
    this.deferredUpdates.clear()
  }
}
