import fs from 'node:fs'
import path from 'node:path'

import globby from 'globby'
import {type CDPSession} from 'playwright'
import SourceMap from 'source-map'

type CpuProfile = Extract<
  Awaited<ReturnType<CDPSession['send']>>,
  {profile: {nodes: unknown[]; startTime: number; endTime: number}}
>['profile']

export async function remapCpuProfile(
  cpuProfile: CpuProfile,
  sourceMapsDir: string,
): Promise<CpuProfile> {
  const sourceMaps = new Map()
  const sourceMapFiles = await globby(path.join(sourceMapsDir, '**/*.map'))

  for (const sourceMapFile of sourceMapFiles) {
    const mapContent = await fs.promises.readFile(sourceMapFile, 'utf8')
    const consumer = await new SourceMap.SourceMapConsumer(JSON.parse(mapContent))
    sourceMaps.set(path.basename(sourceMapFile, '.map'), consumer)
  }

  const remappedCpuProfile = {
    ...cpuProfile,
    nodes: await Promise.all(
      cpuProfile.nodes.map(async (node) => {
        const {callFrame} = node
        if (callFrame.url && callFrame.lineNumber >= 0 && callFrame.columnNumber >= 0) {
          const filename = path.basename(new URL(callFrame.url).pathname)
          const mapConsumer = sourceMaps.get(filename)

          if (mapConsumer) {
            const originalPosition = mapConsumer.originalPositionFor({
              line: callFrame.lineNumber + 1,
              column: callFrame.columnNumber,
            })

            if (originalPosition.source) {
              callFrame.url = originalPosition.source
              callFrame.lineNumber = originalPosition.line - 1
              callFrame.columnNumber = originalPosition.column
              callFrame.functionName = originalPosition.name || callFrame.functionName
            }
          }
        }
        return node
      }),
    ),
  }

  for (const consumer of sourceMaps.values()) {
    consumer.destroy()
  }

  return remappedCpuProfile
}
