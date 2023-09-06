import path from 'path'
import {readFile} from 'fs/promises'
import {runSanityCmdCommand, studiosPath, studioVersions} from './shared/environment'
import {describeCliTest, testConcurrent} from './shared/describe'

describeCliTest('CLI: `sanity typegen`', () => {
  describe.each(studioVersions)('%s', (version) => {
    const testConcurrentV3 = version === 'v3' ? testConcurrent : test.skip

    // Builds can take a bit of time with lots of concurrent tasks and slow CIs
    jest.setTimeout(240 * 1000)

    const studioPath = path.join(studiosPath, version)

    testConcurrentV3(
      'typegen',
      async () => {
        // Build to a different output directory to avoid conflicting with
        // `sanity deploy` / `sanity start` / `sanity build` tests
        const envTestId = `actual-env-${Math.random().toString(36).slice(2)}`
        const result = await runSanityCmdCommand(
          version,
          ['typegen', './out-typegen/sanity.schema.typegen-d.ts'],
          {
            env: {SANITY_STUDIO_FROM_ACTUAL_ENV: envTestId},
          },
        )
        expect(result.code).toBe(0)

        const generatedTypes = await readFile(
          path.join(studioPath, 'out-typegen', 'sanity.schema.typegen-d.ts'),
          'utf8',
        )
        expect(generatedTypes).toMatchSnapshot()
      },
      version === 'v3' ? 120 * 1000 : 240 * 1000,
    )
  })
})
