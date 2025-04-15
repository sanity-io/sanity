import {type SanityClient} from '@sanity/client'
import {
  type AssetSource,
  type AssetSourceUploader,
  type AssetSourceUploadEvent,
  type AssetSourceUploadFile,
  type AssetSourceUploadSubscriber,
  type SchemaType,
} from '@sanity/types'
import {uuid} from '@sanity/uuid'
import {get} from 'lodash'
import {type Subscription} from 'rxjs'

import {resolveUploader} from '../uploads/resolveUploader'
import {type CreateDatasetAssetSourceProps} from './createAssetSource'

export {type SanityClient} from '@sanity/client'

export class DatasetUploader implements AssetSourceUploader {
  private files: AssetSourceUploadFile[] = []
  private subscribers = new Set<AssetSourceUploadSubscriber>()
  private client: SanityClient
  private subscriptions: Map<string, Subscription> = new Map()

  public constructor(private props: CreateDatasetAssetSourceProps) {
    this.client = props.client
  }

  private checkAllComplete(): void {
    const isDone =
      this.files.length > 0 &&
      this.files.every((file) => ['complete', 'error', 'aborted'].includes(file.status))
    if (isDone) {
      this.emit({type: 'all-complete', files: this.files})
      this.reset()
    }
  }

  private emit(event: AssetSourceUploadEvent): void {
    this.subscribers.forEach((fn) => fn(event))
  }

  upload(
    files: globalThis.File[],
    options?: {
      schemaType?: SchemaType
      onChange?: (patch: unknown) => void
    },
  ): AssetSourceUploadFile[] {
    const {schemaType, onChange} = options || {}
    for (const file of files) {
      if (!schemaType) {
        throw new Error('No schema type provided for file upload')
      }
      if (!onChange) {
        throw new Error('No onChange provided for file upload')
      }
      const uploader = resolveUploader(schemaType, file)
      const uploadOptions = {
        metadata: get(schemaType, 'options.metadata'),
        storeOriginalFilename: get(schemaType, 'options.storeOriginalFilename'),
      }
      const fileId = uuid()
      const uploadFile: AssetSourceUploadFile = {
        id: fileId,
        file,
        progress: 0,
        status: 'pending',
      }
      this.files.push(uploadFile)
      if (uploader) {
        this.subscriptions.set(
          fileId,
          uploader.upload(this.client, file, schemaType, uploadOptions).subscribe({
            next: (progressEvent) => {
              const {patches} = progressEvent
              this.updateFile(uploadFile.id, {status: 'uploading'})
              if (patches) {
                onChange(patches)
              }
            },
            error: (error) => {
              let _err: Error
              if (error instanceof Error) {
                _err = error
              } else {
                _err = new Error('Unknown error')
              }
              this.updateFile(uploadFile.id, {status: 'error', error: _err})
              this.emit({
                type: 'error',
                files: this.files.filter((erroredFile) => erroredFile.status === 'error'),
              })
              this.subscriptions.get(fileId)?.unsubscribe()
            },
            complete: () => {
              this.updateFile(uploadFile.id, {status: 'complete'})
              this.subscriptions.get(fileId)?.unsubscribe()
            },
          }),
        )
      }
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

export function createDatasetUploader(
  props: CreateDatasetAssetSourceProps,
): AssetSource['uploader'] {
  return new DatasetUploader(props)
}
