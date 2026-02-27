import {defineType} from '@sanity/types'

export const videoAsset = defineType({
  name: 'sanity.videoAsset',
  title: 'Video',
  type: 'document',
  fieldsets: [
    {
      name: 'system',
      title: 'System fields',
      description: 'These fields are managed by the system and not editable',
    },
  ],
  fields: [
    {
      name: 'originalFilename',
      type: 'string',
      title: 'Original file name',
      readOnly: true,
    },
    {
      name: 'label',
      type: 'string',
      title: 'Label',
    },
    {
      name: 'title',
      type: 'string',
      title: 'Title',
    },
    {
      name: 'description',
      type: 'string',
      title: 'Description',
    },
    {
      name: 'altText',
      type: 'string',
      title: 'Alternative text',
    },
    {
      name: 'creditLine',
      type: 'string',
      title: 'Credit line',
    },
    {
      name: 'metadata',
      type: 'sanity.videoMetadata',
      title: 'Video metadata',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'sha1hash',
      type: 'string',
      title: 'SHA1 hash',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'extension',
      type: 'string',
      title: 'File extension',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'mimeType',
      type: 'string',
      title: 'Mime type',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'size',
      type: 'number',
      title: 'File size in bytes',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'assetId',
      type: 'string',
      title: 'Asset ID',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'uploadId',
      type: 'string',
      readOnly: true,
      hidden: true,
      fieldset: 'system',
    },
    {
      name: 'path',
      type: 'string',
      title: 'Path',
      readOnly: true,
      fieldset: 'system',
    },
    {
      name: 'url',
      type: 'string',
      title: 'Url',
      readOnly: true,
      fieldset: 'system',
    },
  ],
  preview: {
    select: {
      title: 'originalFilename',
      path: 'path',
      mimeType: 'mimeType',
      size: 'size',
      duration: 'metadata.duration',
    },
    prepare(doc: Record<string, any>) {
      const duration = doc.duration
        ? `${Math.floor(doc.duration / 60)}:${String(Math.floor(doc.duration % 60)).padStart(2, '0')}`
        : ''
      return {
        title: doc.title || doc.path.split('/').slice(-1)[0],
        subtitle: `${doc.mimeType} (${(doc.size / 1024 / 1024).toFixed(2)} MB)${duration ? ` - ${duration}` : ''}`,
      }
    },
  },
  orderings: [
    {
      title: 'File size',
      name: 'fileSizeDesc',
      by: [{field: 'size', direction: 'desc'}],
    },
    {
      title: 'Duration',
      name: 'durationDesc',
      by: [{field: 'metadata.duration', direction: 'desc'}],
    },
  ],
})
