interface MimeTypeInfo {
  title: string
}

const MIME_TYPES: Record<string, MimeTypeInfo> = {
  // Images
  'image/bmp': {
    title: 'Bitmap',
  },
  'image/jpeg': {
    title: 'JPEG',
  },
  'image/gif': {
    title: 'GIF',
  },
  'image/vnd.microsoft.icon': {
    title: 'Icon',
  },
  'image/png': {
    title: 'PNG',
  },
  'image/svg+xml': {
    title: 'SVG',
  },
  'image/webp': {
    title: 'WEBP',
  },
  'image/tiff': {
    title: 'TIFF',
  },
  'image/heic': {
    title: 'HEIC',
  },
  // Audio
  'audio/midi': {
    title: 'MIDI',
  },
  'audio/midi-x': {
    title: 'MIDI',
  },
  'audio/mpeg': {
    title: 'MP3 Audio',
  },
  'audio/ogg': {
    title: 'OGG Audio',
  },
  'audio/wav': {
    title: 'WAW Audio',
  },
  'audio/webm': {
    title: 'WEBM Audio',
  },
  'audio/aac': {
    title: 'AAC Audio',
  },
  // Video
  'video/x-msvideo': {
    title: 'AVI',
  },
  'video/mp4': {
    title: 'MP4',
  },
  'video/mpeg': {
    title: 'MPEG',
  },
  'video/ogg': {
    title: 'OGG',
  },
  'video/webm': {
    title: 'WEBM',
  },
  'video/quicktime': {
    title: 'QuickTime',
  },
  // Documents
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': {
    title: 'Microsoft Excel',
  },
  'application/vnd.ms-excel': {
    title: 'Microsoft Excel',
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
    title: 'text/csv',
  },
  'text/css': {
    title: 'CSS',
  },
  'application/pdf': {
    title: 'PDF',
  },
  'application/xml': {
    title: 'XML',
  },
  'text/xml': {
    title: 'XML',
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
