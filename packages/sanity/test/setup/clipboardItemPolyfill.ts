// Conditionally define types only if they don't already exist
type MaybeClipboardItemData = {[mimeType: string]: Blob}
type MaybeClipboardItemDelayedData = {[mimeType: string]: Promise<Blob>}

// Use a type assertion to avoid conflicts with existing definitions
const ClipboardItemPolyfill = class ClipboardItem {
  private data: MaybeClipboardItemData

  constructor(data: MaybeClipboardItemData) {
    this.data = data
  }

  static async createDelayed(items: MaybeClipboardItemDelayedData): Promise<ClipboardItem> {
    const resolvedItems: MaybeClipboardItemData = {}
    for (const [type, value] of Object.entries(items)) {
      resolvedItems[type] = await value
    }
    return new ClipboardItem(resolvedItems)
  }

  async getType(type: string): Promise<Blob> {
    return this.data[type]
  }

  get types(): string[] {
    return Object.keys(this.data)
  }
} as {
  new (data: MaybeClipboardItemData): ClipboardItem
  createDelayed(items: MaybeClipboardItemDelayedData): Promise<ClipboardItem>
}

if (typeof ClipboardItem === 'undefined') {
  ;(global as any).ClipboardItem = ClipboardItemPolyfill
}
