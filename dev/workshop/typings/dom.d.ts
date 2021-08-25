/**
 * @todo Remove when TypeScript supports this
 * @see https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1004
 */
interface ClipboardItem {
  readonly types: string[]
  readonly presentationStyle: 'unspecified' | 'inline' | 'attachment'
  getType(): Promise<Blob>
}

/**
 * @todo Remove when TypeScript supports this
 * @see https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1004
 */
interface ClipboardItemData {
  [mimeType: string]: Blob | string | Promise<Blob | string>
}

/**
 * @todo Remove when TypeScript supports this
 * @see https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1004
 */
// eslint-disable-next-line @typescript-eslint/no-redeclare, no-var
declare var ClipboardItem: {
  prototype: ClipboardItem
  new (itemData: ClipboardItemData): ClipboardItem
}

/**
 * Augment `Clipboard`
 * @todo Remove when TypeScript supports this
 * @see https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1004
 */
interface Clipboard {
  read(): Promise<DataTransfer>
  write(data: ClipboardItem[]): Promise<void>
}
