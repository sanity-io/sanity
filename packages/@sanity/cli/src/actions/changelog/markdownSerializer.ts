import {toHTML} from '@portabletext/to-html'

function htmlDecode(text: string): string {
  const replacements: Record<string, string> = {
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&nbsp;': ' ',
    '&#x27;': "'",
  }

  return text.replace(/&(amp|lt|gt|quot|#39|nbsp|#x27);/g, (match) => replacements[match] || match)
}

export function markdownSerializer(value?: any[]): string {
  if (!value) return ''

  /**
   * Higher-order function that wraps a renderer function to append double newlines
   * to the output, creating proper Markdown paragraph spacing
   */
  const mdBlock = <T extends object>(renderFn: (props: T) => string) => {
    return (props: T) => `${renderFn(props)}\n\n`
  }

  return htmlDecode(
    toHTML(value, {
      components: {
        block: {
          normal: mdBlock(({children}) => `${children}`),
          h1: mdBlock(({children}) => `# ${children}`),
          h2: mdBlock(({children}) => `## ${children}`),
          h3: mdBlock(({children}) => `### ${children}`),
          h4: mdBlock(({children}) => `#### ${children}`),
          h5: mdBlock(({children}) => `##### ${children}`),
          h6: mdBlock(({children}) => `###### ${children}`),
          blockquote: mdBlock(({children}) => `> ${children}`),
          list: mdBlock(({children}) => `${children}`),
        },
        types: {
          codeBlock: mdBlock(({value}: {value: any}) => {
            if (!value.blocks || value.blocks.length === 0) return ''

            let markdown = ''
            for (const block of value.blocks) {
              if (!block.code) continue
              const language = block.code.language || ''
              markdown += `\`\`\`${language}\n${block.code.code}\n\`\`\``
            }

            return markdown
          }),
          code: mdBlock(({value}: {value: any}) => {
            const language = value.language || ''
            return `\`\`\`${language}\n${value.code || ''}\n\`\`\``
          }),
          image: mdBlock(({value}: {value: any}) => {
            return `![${value.alt || ''}](${value.asset?.url || ''})`
          }),
          // Handle custom block types that might not be properly configured
          muxVideo: () => '', // Ignore video blocks in changelog output
          docsCallout: mdBlock(({value}: {value: any}) => {
            const type = value.type || 'info'
            const title = value.title || ''
            const mapCalloutType = (calloutType: string) => {
              if (calloutType === 'info') return 'note'
              if (calloutType === 'error') return 'caution'
              return calloutType
            }

            let markdown = `> [!${mapCalloutType(type).toUpperCase()}]`
            if (title) markdown += ` ${title}`
            markdown += '\n'

            // Convert portable text content to markdown recursively
            const content = value?.content ? markdownSerializer(value.content) : ''
            if (content) {
              const quotedContent = content
                .split('\n')
                .filter((line) => line.trim()) // Remove empty lines
                .map((line) => `> ${line}`)
                .join('\n')
              markdown += quotedContent
            }

            return markdown
          }),
          docsPaidFeature: mdBlock(({value}: {value: any}) => {
            const planTitle = value.plan?.title || 'paid'
            if (value.isAddon) {
              return `> [!NOTE]\n> This is a paid feature, available as an addon on the ${planTitle} plan.`
            }
            return `> [!NOTE]\n> This is a paid feature, available on the ${planTitle} plan.`
          }),
        },
        marks: {
          'link': (props: any) => {
            const href = props.value?.href || ''
            if (!href) return props.text
            return `[${props.text}](${href})`
          },
          'code': (props: any) => `\`${props.text}\``,
          'em': (props: any) => `*${props.text}*`,
          'strong': (props: any) => `**${props.text}**`,
          'underline': (props: any) => `__${props.text}__`,
          'strike-through': (props: any) => `~~${props.text}~~`,
        },
        listItem: {
          bullet: (props: any) => `- ${props.children || ''}\n`,
          number: (props: any) => `${(props.index || 0) + 1}. ${props.children || ''}\n`,
        },
        list: {
          bullet: (props: any) => `${props.children || ''}\n`,
          number: (props: any) => `${props.children || ''}\n`,
        },
        hardBreak: () => '\n',
      },
      onMissingComponent: (type: string, node: any) => {
        // Handle unknown block types gracefully instead of showing HTML error divs
        if (type === 'muxVideo') {
          return '' // Ignore video blocks in changelog output
        }
        if (type === 'docsCallout') {
          return `> [!NOTE]\n> ${node.value?.title || 'Note'}`
        }
        if (type === 'docsPaidFeature') {
          return '> [!NOTE]\n> This is a paid feature'
        }
        // For other unknown types, return empty string to avoid HTML remnants
        return ''
      },
    }),
  )
}
