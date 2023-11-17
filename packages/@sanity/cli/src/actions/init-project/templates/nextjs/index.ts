import {blogSchemaFolder, blogSchemaTS, blogSchemaJS} from './schemas/blog'

export const sanityConfigTemplate = `/**
 * This configuration is used to for the Sanity Studio that’s mounted on the \`:route:\` route
 */

import {visionTool} from '@sanity/vision'
import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'

// Go to https://www.sanity.io/docs/api-versioning to learn how API versioning works
import {apiVersion, dataset, projectId} from './sanity/env'
import {schema} from './sanity/schema'

export default defineConfig({
  basePath: ':basePath:',
  projectId,
  dataset,
  // Add and edit the content schema in the './sanity/schema' folder
  schema,
  plugins: [
    deskTool(),
    // Vision is a tool that lets you query your content with GROQ in the studio
    // https://www.sanity.io/docs/the-vision-plugin
    visionTool({defaultApiVersion: apiVersion}),
  ],
})
`

export const sanityCliTemplate = `/**
* This configuration file lets you run \`$ sanity [command]\` in this folder
* Go to https://www.sanity.io/docs/cli to learn more.
**/
import { defineCliConfig } from 'sanity/cli'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

export default defineCliConfig({ api: { projectId, dataset } })
`

export const sanityStudioPagesTemplate = `import Head from 'next/head'
import { NextStudio } from 'next-sanity/studio'
import { metadata } from 'next-sanity/studio/metadata'
import config from ':configPath:'

export default function StudioPage() {
  return (
    <>
      <Head>
        {Object.entries(metadata).map(([key, value]) => (
          <meta key={key} name={key} content={value} />
        ))}
      </Head>
      <NextStudio config={config} />
    </>
  )
}`

export const sanityStudioAppTemplate = `'use client'

/**
 * This route is responsible for the built-in authoring environment using Sanity Studio.
 * All routes under your studio path is handled by this file using Next.js' catch-all routes:
 * https://nextjs.org/docs/routing/dynamic-routes#catch-all-routes
 *
 * You can learn more about the next-sanity package here:
 * https://github.com/sanity-io/next-sanity
 */

import { NextStudio } from 'next-sanity/studio'
import config from ':configPath:'

export default function StudioPage() {
  return <NextStudio config={config} />
}`

export const sanityStudioAppLayoutTemplate = `export {metadata} from 'next-sanity/studio'`

// Format today's date like YYYY-MM-DD
const envTS = `export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '${new Date().toISOString().split('T')[0]}'

export const dataset = assertValue(
  process.env.NEXT_PUBLIC_SANITY_DATASET,
  'Missing environment variable: NEXT_PUBLIC_SANITY_DATASET'
)

export const projectId = assertValue(
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  'Missing environment variable: NEXT_PUBLIC_SANITY_PROJECT_ID'
)

export const useCdn = false

function assertValue<T>(v: T | undefined, errorMessage: string): T {
  if (v === undefined) {
    throw new Error(errorMessage)
  }

  return v
}
`

const envJS = `export const apiVersion =
  process.env.NEXT_PUBLIC_SANITY_API_VERSION || '${new Date().toISOString().split('T')[0]}'

export const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET;
export const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID;
export const useCdn = false
`

const schemaTS = `import { type SchemaTypeDefinition } from 'sanity'

export const schema: { types: SchemaTypeDefinition[] } = {
  types: [],
}
`

const schemaJS = `export const schema = {
  types: [],
}
`

const client = `import { createClient } from 'next-sanity'

import { apiVersion, dataset, projectId, useCdn } from '../env'

export const client = createClient({
  apiVersion,
  dataset,
  projectId,
  useCdn,
})
`

const imageTS = `import createImageUrlBuilder from '@sanity/image-url'
import type { Image } from 'sanity'

import { dataset, projectId } from '../env'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source: Image) => {
  return imageBuilder?.image(source).auto('format').fit('max')
}
`

const imageJS = `import createImageUrlBuilder from '@sanity/image-url'

import { dataset, projectId } from '../env'

const imageBuilder = createImageUrlBuilder({
  projectId: projectId || '',
  dataset: dataset || '',
})

export const urlForImage = (source) => {
  return imageBuilder?.image(source).auto('format').fit('max')
}
`

type FolderStructure = Record<string, string | Record<string, string>>

export const sanityFolder = (
  useTypeScript: boolean,
  template?: 'clean' | 'blog',
): FolderStructure => {
  const isBlogTemplate = template === 'blog'

  const structure: FolderStructure = {
    // eslint-disable-next-line no-nested-ternary
    'schema.': useTypeScript
      ? isBlogTemplate
        ? blogSchemaTS
        : schemaTS
      : isBlogTemplate
        ? blogSchemaJS
        : schemaJS,
    'env.': useTypeScript ? envTS : envJS,
    lib: {
      'client.': client,
      'image.': useTypeScript ? imageTS : imageJS,
    },
  }

  if (isBlogTemplate) {
    structure.schemas = blogSchemaFolder(useTypeScript)
  }

  return structure
}
