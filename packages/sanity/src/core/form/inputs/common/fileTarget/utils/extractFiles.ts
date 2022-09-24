/**
 * Utilities for extracting files from dataTransfer in a predictable cross-browser fashion.
 * Also recursively extracts files from a directory
 * Inspired by https://github.com/component/normalized-upload
 */

import {flatten} from 'lodash'
import {FIXME} from '../../../../../FIXME'

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
        return entry.isDirectory ? walk(entry as FIXME) : toArray(item.getAsFile())
      }

      if (item.kind === 'file') {
        const file = item.getAsFile()
        return Promise.resolve(file ? [file] : [])
      }

      if (item.kind === 'string') {
        // We previously had support for reading datatransfer of strings here but decided to remove it since we don't handle it in higher up in the stack yet.
        // If one day we want to support data transfer from a string value (e.g. copy+paste from a field to another), an earlier
        // version of this file includes an implementation that uses DataTransferItem.getAsString to read the string value into a File
        console.warn('DataTransfer with kind="string" is currently not supported')
        return Promise.resolve([])
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
    return new Promise<File>((resolve, reject) => entry.file(resolve, reject)).then(
      (file: File) => [file]
    )
  }

  if (entry.isDirectory) {
    const dir = entry.createReader()
    return new Promise<Entry[]>((resolve, reject) => dir.readEntries(resolve, reject))
      .then((entries) => entries.filter((entr) => !entr.name.startsWith('.')))
      .then((entries) => Promise.all(entries.map(walk)).then(flatten))
  }
  return Promise.resolve([])
}
