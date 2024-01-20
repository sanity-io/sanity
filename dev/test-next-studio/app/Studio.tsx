'use client'

import {useMemo} from 'react'
import {defineConfig, Studio, type StudioProps} from 'sanity'
import {structureTool} from 'sanity/structure'

export default function StudioRoot({
  basePath,
  scheme,
  unstable_globalStyles,
  unstable_noAuthBoundary,
}: {basePath: string} & Pick<
  StudioProps,
  'scheme' | 'unstable_noAuthBoundary' | 'unstable_globalStyles'
>) {
  const config = useMemo(
    () =>
      defineConfig({
        basePath,
        plugins: [structureTool()],
        projectId: 'ppsg7ml5',
        dataset: 'test',
        schema: {
          types: [
            {
              type: 'document',
              name: 'post',
              title: 'Post',
              fields: [
                {
                  type: 'string',
                  name: 'title',
                  title: 'Title',
                },
              ],
            },
          ],
        },
      }),
    [basePath],
  )

  return (
    <div id="sanity">
      <Studio
        config={config}
        scheme={scheme}
        unstable_globalStyles={unstable_globalStyles}
        unstable_noAuthBoundary={unstable_noAuthBoundary}
      />
    </div>
  )
}
