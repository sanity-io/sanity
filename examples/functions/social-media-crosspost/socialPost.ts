import {defineField, defineType} from 'sanity'
import {CharacterCount} from '../../components/characterCount'

export const platformConfig = {
  x: {limit: 280, label: 'X'},
  mastodon: {limit: 500, label: 'Mastodon'},
  bluesky: {limit: 300, label: 'Bluesky'},
  linkedin: {limit: 3000, label: 'LinkedIn'},
  discord: {limit: 2000, label: 'Discord'},
  telegram: {limit: 4096, label: 'Telegram'},
  slack: {limit: 4000, label: 'Slack'},
  devto: {limit: 10_000, label: 'Dev.to'},
} as const

export type Platform = keyof typeof platformConfig

const platformOptions = (Object.keys(platformConfig) as Array<Platform>).map((k) => ({
  title: platformConfig[k].label,
  value: k,
}))

export const socialPost = defineType({
  name: 'socialPost',
  title: 'Social Post',
  type: 'document',
  fields: [
    defineField({
      name: 'platforms',
      title: 'Platforms',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: ({document}) => Boolean(document?.status),
      options: {
        list: platformOptions,
        layout: 'grid',
      },
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'text',
      rows: 5,
      readOnly: ({document}) => Boolean(document?.status),
      description: 'The global body of the post. It can be overridden by platform below.',
      validation: (Rule) =>
        Rule.required().custom((body, context) => {
          const document = context.document as any
          const selectedPlatforms = document?.platforms as Platform[] | undefined
          const overriddenSettings = document?.platformOverrides

          if (!document || !body || !Array.isArray(selectedPlatforms)) {
            return true
          }

          const errors = selectedPlatforms
            .filter(
              (platform) =>
                !overriddenSettings?.some(
                  (setting: any) => setting.platform === platform && setting.body?.trim(),
                ),
            )
            .reduce<string[]>((acc, platform) => {
              const {limit, label} = platformConfig[platform]
              if (body.length > limit) {
                acc.push(`${label} body cannot be longer than ${limit} characters.`)
              }
              return acc
            }, [])

          return errors.length > 0 ? errors.join(' ') : true
        }),
    }),
    defineField({
      name: 'characterCount',
      title: 'Character Count',
      type: 'string',
      components: {
        field: CharacterCount,
      },
      readOnly: true,
    }),
    defineField({
      name: 'mainImage',
      title: 'Image',
      type: 'image',
      readOnly: ({document}) => Boolean(document?.status),
      options: {
        hotspot: true,
      },
      fields: [
        {
          name: 'alt',
          type: 'string',
          title: 'Alternative text',
          description: 'Important for accessibility and SEO.',
        },
      ],
    }),
    defineField({
      name: 'platformOverrides',
      title: 'Platform Overrides',
      type: 'array',
      readOnly: ({document}) => Boolean(document?.status),
      of: [
        {
          type: 'object',
          fields: [
            defineField({
              name: 'platform',
              title: 'Platform',
              type: 'string',
              options: {
                list: platformOptions,
              },
              validation: (Rule) =>
                Rule.required().custom((value, context) => {
                  const document = context.document as any
                  const selected = Array.isArray(document?.platforms) ? document.platforms : []
                  if (!value) return true
                  return selected.includes(value)
                    ? true
                    : "Pick a platform that's selected in the Platforms field."
                }),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'text',
              validation: (Rule) =>
                Rule.custom((body, context) => {
                  const {document} = context
                  if (!document || !body) {
                    return true
                  }
                  const override = context.parent as {platform: Platform}
                  const {limit, label} = platformConfig[override.platform]
                  if (body.length > limit) {
                    return `${label} body cannot be longer than ${limit} characters.`
                  }
                  return true
                }),
            }),
            defineField({
              name: 'characterCount',
              title: 'Character Count',
              type: 'string',
              components: {
                field: CharacterCount,
              },
              readOnly: true,
            }),
          ],
        },
      ],
    }),
    defineField({
      name: 'status',
      title: 'Status',
      description:
        'The state of each request. Links to the published posts if successful or the error message.',
      type: 'array',
      of: [{type: 'string'}],
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      title: 'body',
      subtitle: 'platforms',
    },
    prepare(selection) {
      const {title: body, subtitle: platforms} = selection

      const title = body || 'Untitled Post'

      const subtitle = platforms
        ? platforms
            .map((platform: keyof typeof platformConfig) => platformConfig[platform].label)
            .sort()
            .join(', ')
        : ''

      return {title, subtitle}
    },
  },
})
