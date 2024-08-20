import {readFile} from 'node:fs/promises'

import * as json5 from 'json5'
import * as z from 'zod'

export const configDefintion = z.object({
  path: z
    .string()
    .or(z.array(z.string()))
    .default([
      './src/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      './app/**/*.{ts,tsx,js,jsx,mjs,cjs}',
      './sanity/**/*.{ts,tsx,js,jsx,mjs,cjs}',
    ]),
  schema: z.string().default('./schema.json'),
  generates: z.string().default('./sanity.types.ts'),
  formatGeneratedCode: z.boolean().default(true),
  overloadClientMethods: z.boolean().default(true),
})

export type CodegenConfig = z.infer<typeof configDefintion>

export async function readConfig(path: string): Promise<CodegenConfig> {
  try {
    const content = await readFile(path, 'utf-8')
    const json = json5.parse(content)
    return configDefintion.parseAsync(json)
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Error in config file\n ${error.errors.map((err) => err.message).join('\n')}`)
    }
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'ENOENT') {
      return configDefintion.parse({})
    }

    throw error
  }
}
