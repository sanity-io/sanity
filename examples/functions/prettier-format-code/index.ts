import {documentEventHandler} from '@sanity/functions'
import {createClient} from '@sanity/client'
import {format, type Options} from 'prettier'

const PRETTIER_CONFIG: Options = {
  semi: false,
  singleQuote: true,
  trailingComma: 'es5',
  printWidth: 60,
  tabWidth: 2,
  useTabs: false,
}

const BLOCK_CONTENT_FIELD_NAME = 'content'

export const handler = documentEventHandler(async ({context, event}) => {
  console.log('Begin formatting code function...')

  const client = createClient({
    ...context.clientOptions,
    useCdn: false,
    apiVersion: '2025-08-21',
  })

  if (!event.data[BLOCK_CONTENT_FIELD_NAME]) {
    console.log('No content')
    return
  }

  const codeBlocks = event.data[BLOCK_CONTENT_FIELD_NAME].filter((block) => block._type === 'code')

  if (!codeBlocks.length) {
    console.log('No code blocks')
    return
  }

  try {
    const formattedCodeBlocks = await Promise.all(
      codeBlocks.map(async (block) => {
        if (block._type !== 'code' || !block.code) {
          return block
        }

        try {
          // Determine parser based on language
          const parser = getParserForLanguage(block.language)

          if (!parser) {
            console.warn(`No parser found for language: ${block.language}`)
            return block
          }

          // Format the code using Prettier
          const formattedCode = await format(block.code, {
            parser,
            ...PRETTIER_CONFIG,
          })

          return {
            ...block,
            code: formattedCode,
          }
        } catch (formatError) {
          console.warn(`Failed to format code block ${block._key}:`, formatError)
          // Return original block if formatting fails
          return block
        }
      }),
    )

    // Find changed code blocks by comparing formatted code with original code
    const changedCodeBlocks = formattedCodeBlocks.filter((formattedBlock) => {
      const originalBlock = event.data[BLOCK_CONTENT_FIELD_NAME].find(
        (block) => block._key === formattedBlock._key,
      )
      return (
        originalBlock &&
        originalBlock._type === 'code' &&
        formattedBlock.code !== originalBlock.code
      )
    })

    if (!changedCodeBlocks.length) {
      console.log('No changed code blocks')
      return
    }

    const transaction = client.transaction()
    for (const block of changedCodeBlocks) {
      const patch = client.patch(event.data._id).set({
        [`${BLOCK_CONTENT_FIELD_NAME}[_key=="${block._key}"].code`]: block.code,
      })
      transaction.patch(patch)
    }
    await transaction.commit()
    console.log(
      `Formatted ${changedCodeBlocks.length === 1 ? '1 code block' : `${changedCodeBlocks.length} code blocks`}`,
    )
  } catch (error) {
    console.error('Error formatting code blocks:', error)
    throw error
  }
})

function getParserForLanguage(language?: string): string {
  if (!language) return 'babel'

  const languageMap: Record<string, string> = {
    tsx: 'typescript',
    ts: 'typescript',
    jsx: 'babel',
    js: 'babel',
    json: 'json',
    css: 'css',
    scss: 'scss',
    less: 'less',
    html: 'html',
    vue: 'vue',
    yaml: 'yaml',
    markdown: 'markdown',
    md: 'markdown',
  }

  return languageMap[language] || 'babel'
}
