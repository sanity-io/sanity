import {
  type AssetSourceUploader,
  type AssetSourceUploadEvent,
  type AssetSourceUploadFile,
  type AssetSourceUploadSubscriber,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'

export class MediaLibraryUploader implements AssetSourceUploader {
  private files: AssetSourceUploadFile[] = []
  private subscribers = new Set<AssetSourceUploadSubscriber>()

  private checkAllComplete(): void {
    const isDone =
      this.files.length > 0 &&
      this.files.every((file) => ['complete', 'error', 'aborted'].includes(file.status))
    if (isDone) {
      this.emit({type: 'all-complete', files: this.files})
      const hasError = this.files.some((file) => file.status === 'error')
      if (hasError) {
        this.emit({
          type: 'error',
          files: this.files.filter((file) => file.status === 'error'),
        })
      }
      this.reset()
    }
  }

  private emit(event: AssetSourceUploadEvent): void {
    this.subscribers.forEach((fn) => fn(event))
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
    if (target) {
      if (data.error) {
        target.error = data.error
      }
      if (data.progress && data.progress !== target.progress) {
        target.progress = data.progress
        this.emit({type: 'progress', file: target, progress: target.progress * 100})
      }
      if (data.status && data.status !== target.status) {
        target.status = data.status as AssetSourceUploadFile['status']
        this.emit({type: 'status', file: target, status: target.status})
      }
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
  }
}
