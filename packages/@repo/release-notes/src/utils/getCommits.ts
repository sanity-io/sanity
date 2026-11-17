import {type ConventionalGitClient} from '@conventional-changelog/git-client'
import {type Preset} from 'conventional-changelog'
import createPreset from 'conventional-changelog-conventionalcommits'
import {type ParserStreamOptions} from 'conventional-commits-parser'

/**
 * Parser options from the `conventionalcommits` preset (the same preset used
 * for version bumping and CHANGELOG.md generation). Unlike the parser
 * defaults, these handle the breaking-change marker (`feat!:`) and populate
 * `notes` for it.
 *
 * The preset's own typings declare `createPreset()` as returning `{}`, so the
 * result is read through the `Preset` shape that `conventional-changelog`
 * loads presets into.
 */
export function getParserOptions(): ParserStreamOptions {
  const preset: Preset = createPreset()
  if (!preset.parser) {
    throw new Error('The conventionalcommits preset did not provide parser options')
  }
  return preset.parser
}

export async function getSemverTags(gitClient: ConventionalGitClient, params?: {tags: string[]}) {
  const tags: string[] = []
  for await (const tag of gitClient.getSemverTags()) {
    tags.push(tag)
  }
  return tags
}

export async function* getCommits(
  gitClient: ConventionalGitClient,
  semverTags: string[],
  options: {branch?: string; releaseCount?: number; path?: string; tags?: string[]},
) {
  const {releaseCount, path, branch = 'main'} = options
  const params = {
    from: releaseCount ? semverTags[releaseCount - 1] : undefined,
    format: '%B%n-hash-%n%H%n-gitTags-%n%d%n-committerDate-%n%ci',
    merges: false,
  }
  await gitClient.verify(branch)
  let reverseTags = semverTags.toReversed()
  reverseTags.push(branch)
  if (params.from) {
    if (reverseTags.includes(params.from)) {
      reverseTags = reverseTags.slice(reverseTags.indexOf(params.from))
    } else {
      reverseTags = [params.from, branch]
    }
  } else {
    reverseTags.unshift('')
  }
  const parserOptions = getParserOptions()
  const streams = []
  for (let i = 1, len = reverseTags.length; i < len; i++) {
    streams.push(
      gitClient.getCommits(
        {
          ...params,
          from: reverseTags[i - 1],
          to: reverseTags[i],
          path,
        },
        parserOptions,
      ),
    )
  }
  for (const stream of streams) {
    yield* stream
  }
}
