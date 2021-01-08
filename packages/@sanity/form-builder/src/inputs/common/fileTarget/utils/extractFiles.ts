/**
 * Utilities for extracting files from dataTransfer in a predictable cross-browser fashion.
 * Also recursively extracts files from a directory
 * Inspired by https://github.com/component/normalized-upload
 * Contains special handling of
 */

import {flatten} from 'lodash'

export function extractPastedFiles(dataTransfer: DataTransfer): Promise<Array<File>> {
  if (dataTransfer.files && dataTransfer.files.length > 0) {
    return Promise.resolve(Array.from(dataTransfer.files || []))
  }
  return normalizeItems(Array.from(dataTransfer.items || [])).then(flatten)
}

export function extractDroppedFiles(dataTransfer: DataTransfer) {
  const files: Array<File> = Array.from(dataTransfer.files || [])
  const items: Array<DataTransferItem> = Array.from(dataTransfer.items || [])
  if (files && files.length > 0) {
    return Promise.resolve(files)
  }
  return normalizeItems(items).then(flatten)
}

function normalizeItems(items: Array<DataTransferItem>) {
  return Promise.all(
    items.map((item) => {
      // directory
      if (item.kind === 'file' && item.webkitGetAsEntry) {
        let entry
        // Edge throws
        try {
          entry = item.webkitGetAsEntry()
        } catch (err) {
          return [item.getAsFile()]
        }
        if (!entry) {
          return []
        }
        return entry.isDirectory ? walk(entry) : [item.getAsFile()]
      }

      // file
      if (item.kind === 'file') {
        const file = item.getAsFile()
        return Promise.resolve(file ? [file] : [])
      }

      // others
      return new Promise<string>((resolve) => item.getAsString(resolve)).then((str) =>
        str ? [new File([str], 'unknown.txt', {type: item.type})] : []
      )
    })
  )
}

type WebKitFileEntry = any
function walk(entry: WebKitFileEntry): Promise<File[]> {
  if (entry.isFile) {
    return new Promise((resolve) => entry.file(resolve)).then((file: File) => [file])
  }

  if (entry.isDirectory) {
    const dir = entry.createReader()
    return new Promise<File[]>((resolve) => dir.readEntries(resolve))
      .then((entries) => entries.filter((entr) => !entr.name.startsWith('.')))
      .then((entries) => Promise.all(entries.map(walk)).then(flatten))
  }
  return Promise.resolve([])
}
