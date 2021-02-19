/**
 * Utilities for extracting files from dataTransfer in a predictable cross-browser fashion.
 * Also recursively extracts files from a directory
 * Inspired by https://github.com/component/normalized-upload
 * Contains special handling of
 */

import {flatten} from 'lodash'

export function extractPastedFiles(dataTransfer: DataTransfer): Promise<File[]> {
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return Promise.resolve(Array.from(dataTransfer.files || []))
  }
  return normalizeItems(Array.from(dataTransfer.items || [])).then(flatten)
}

export function extractDroppedFiles(dataTransfer: DataTransfer) {
  const files: File[] = Array.from(dataTransfer.files || [])
  const items: DataTransferItem[] = Array.from(dataTransfer.items || [])
  if (files && files.length > 0) {
    return Promise.resolve(files)
  }
  return normalizeItems(items).then(flatten)
}

function toArray<T>(v: T | null): T[] {
  return v === null ? [] : [v]
}

function normalizeItems(items: DataTransferItem[]) {
  return Promise.all(
    items.map((item) => {
      // directory
      if (item.kind === 'file' && item.webkitGetAsEntry) {
        let entry
        // Edge throws
        try {
          entry = item.webkitGetAsEntry()
        } catch (err) {
          return toArray(item.getAsFile())
        }
        if (!entry) {
          return []
        }
        return entry.isDirectory ? walk(entry) : toArray(item.getAsFile())
      }

      if (item.kind === 'file') {
        const file = item.getAsFile()
        return Promise.resolve(file ? [file] : [])
      }

      if (item.kind === 'string') {
        // note: for some reason item.type has been set to an empty string at the time the DataTransferItem.getAsString callback is called
        // so the next line is there to keep it in scope
        const mimeType = item.type
        return new Promise<string>((resolve) => item.getAsString(resolve)).then((str) => {
          return str ? [new File([str], 'datatransfer.txt', {type: mimeType})] : []
        })
      }

      console.warn('Unknown DataTransferItem.kind: %s', item.kind)
      return Promise.resolve([])
    })
  )
}

// Warning: experimental API: https://wicg.github.io/entries-api
type WebKitFileEntry = {
  isFile: true
  isDirectory: false
  name: string
  fullPath: string
  file: (fileCallback: (file: File) => void, errorCallback?: (error: Error) => void) => void
}

type WebKitDirectoryEntry = {
  isFile: false
  isDirectory: true
  name: string
  fullPath: string
  createReader: () => DirectoryReader
}

type Entry = WebKitFileEntry | WebKitDirectoryEntry

type DirectoryReader = {
  readEntries: (
    successCallback: (entries: Entry[]) => void,
    errorCallback?: (error: Error) => void
  ) => void
}

function walk(entry: Entry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise<File>((resolve, reject) =>
      entry.file(resolve, reject)
    ).then((file: File) => [file])
  }

  if (entry.isDirectory) {
    const dir = entry.createReader()
    return new Promise<Entry[]>((resolve, reject) => dir.readEntries(resolve, reject))
      .then((entries) => entries.filter((entr) => !entr.name.startsWith('.')))
      .then((entries) => Promise.all(entries.map(walk)).then(flatten))
  }
  return Promise.resolve([])
}
