interface MimeTypeInfo {
  title: string
}

const MIME_TYPES: Record<string, MimeTypeInfo> = {
  // Images
  'image/bmp': {
    title: 'Bitmap Image',
  },
  'image/jpeg': {
    title: 'JPEG Image',
  },
  'image/gif': {
    title: 'GIF Image',
  },
  'image/vnd.microsoft.icon': {
    title: 'Icon',
  },
  'image/png': {
    title: 'PNG Image',
  },
  'image/svg+xml': {
    title: 'SVG Image',
  },
  'image/webp': {
    title: 'WebP Image',
  },
  'image/tiff': {
    title: 'TIFF Image',
  },
  'image/heic': {
    title: 'HEIC Image',
  },
  // Audio
  'audio/midi': {
    title: 'MIDI Audio',
  },
  'audio/midi-x': {
    title: 'MIDI Audio',
  },
  'audio/mpeg': {
    title: 'MP3 Audio',
  },
  'audio/ogg': {
    title: 'OGG Audio',
  },
  'audio/wav': {
    title: 'WAV Audio',
  },
  'audio/webm': {
    title: 'WebM Audio',
  },
  'audio/aac': {
    title: 'AAC Audio',
  },
  // Video
  'video/x-msvideo': {
    title: 'AVI Video',
  },
  'video/mp4': {
    title: 'MP4 Video',
  },
  'video/mpeg': {
    title: 'MPEG Video',
  },
  'video/ogg': {
    title: 'OGG Video',
  },
  'video/webm': {
    title: 'WebM Video',
  },
  'video/quicktime': {
    title: 'QuickTime Video',
  },
  // Documents
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    title: 'Excel Spreadsheet',
  },
  'application/vnd.ms-excel': {
    title: 'Excel Spreadsheet',
  },
  'text/plain': {
    title: 'Text',
  },
  'text/javascript': {
    title: 'JavaScript',
  },
  'text/markdown': {
    title: 'Markdown',
  },
  'text/csv': {
    title: 'CSV',
  },
  'text/css': {
    title: 'CSS',
  },
  'application/pdf': {
    title: 'PDF Document',
  },
  'application/xml': {
    title: 'XML Document',
  },
  'text/xml': {
    title: 'XML Document',
  },
  'application/zip': {
    title: 'ZIP Archive',
  },
  'application/vnd.rar': {
    title: 'RAR Archive',
  },
  'application/x-7z-compressed': {
    title: '7-zip Archive',
  },
  'application/octet-stream': {
    title: 'Binary',
  },
}

function convertMimeTypeToSomethingNice(mimeType: string): string {
  const part = mimeType.replace('x-', '').split('/')[1]

  return part.charAt(0).toUpperCase() + part.slice(1)
}

export function formatMimeType(mimeType: string): string {
  if (MIME_TYPES?.[mimeType]) {
    return MIME_TYPES[mimeType].title
  }

  return convertMimeTypeToSomethingNice(mimeType)
}
