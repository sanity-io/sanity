import {execSync} from 'node:child_process'

import {minimatch} from 'minimatch'

import {defaultTags, pathToTagMapping} from './test-mappings.mjs'

function getChangedFiles() {
  try {
    // For PRs, compare with base branch
    if (process.env.GITHUB_EVENT_NAME === 'pull_request') {
      const baseSha = process.env.GITHUB_BASE_REF
      return execSync(`git diff --name-only origin/${baseSha}...HEAD`, {encoding: 'utf-8'})
        .trim()
        .split('\n')
        .filter(Boolean)
    }
    // For push events, get last commit changes
    else if (process.env.GITHUB_EVENT_NAME === 'push') {
      return execSync('git diff --name-only HEAD~1 HEAD', {encoding: 'utf-8'})
        .trim()
        .split('\n')
        .filter(Boolean)
    }
    // Fallback - run all tests
    return []
  } catch (error) {
    console.error('Error getting changed files:', error)
    return []
  }
}

function getTagsToRun() {
  const changedFiles = getChangedFiles()
  console.log('Changed files:', changedFiles)

  // Log matches for debugging
  const matchedPaths = []
  changedFiles.forEach((file) => {
    pathToTagMapping.forEach((mapping) => {
      const matches = mapping.paths.some((pattern) => minimatch(file, pattern))
      if (matches) {
        matchedPaths.push({file, pattern: mapping.paths, tags: mapping.tags})
      }
    })
  })

  console.log('File pattern matches:', matchedPaths.length > 0 ? matchedPaths : 'None')

  if (changedFiles.length === 0) {
    return defaultTags
  }

  const tagsToRun = new Set()

  // Check each changed file against path patterns
  changedFiles.forEach((file) => {
    pathToTagMapping.forEach((mapping) => {
      const matches = mapping.paths.some((pattern) => minimatch(file, pattern))
      if (matches) {
        mapping.tags.forEach((tag) => tagsToRun.add(tag))
      }
    })
  })

  // If no specific tags matched, use default tags
  if (tagsToRun.size === 0) {
    return defaultTags
  }

  return Array.from(tagsToRun)
}

const tagsToRun = getTagsToRun()
console.log('Tags to run:', tagsToRun)

// Output for GitHub Actions
console.log(`::set-output name=test_tags::${tagsToRun.join(',')}`)
