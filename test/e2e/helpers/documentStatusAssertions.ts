import {expect, type Locator} from '@playwright/test'

/**
 * Regular expressions for matching document status text
 * It matches the text "just now" or "secs. ago"
 */
const documentStatusPatterns = {
  published: /^Published (just now|\d+ sec\. ago)/i,
  created: /^Created (just now|\d+ sec\. ago)/i,
  unpublished: /^Unpublished (just now|\d+ sec\. ago)/i,
} as const

/**
 * Options for document status assertions
 */
interface DocumentStatusOptions {
  timeout?: number
  useInnerText?: boolean
}

const DEFAULT_OPTIONS: DocumentStatusOptions = {
  timeout: 60_000,
  useInnerText: true,
}

/**
 * Assert that a document status element shows a published state
 */
export async function expectPublishedStatus(
  statusElement: Locator,
  options: DocumentStatusOptions = DEFAULT_OPTIONS,
) {
  await expect(statusElement).toContainText(documentStatusPatterns.published, {
    useInnerText: options.useInnerText,
    timeout: options.timeout,
  })
}

/**
 * Assert that a document status element shows a created state
 */
export async function expectCreatedStatus(
  statusElement: Locator,
  options: DocumentStatusOptions = DEFAULT_OPTIONS,
) {
  await expect(statusElement).toContainText(documentStatusPatterns.created, {
    useInnerText: options.useInnerText,
    timeout: options.timeout,
  })
}

/**
 * Assert that a document status element shows an unpublished state
 */
export async function expectUnpublishedStatus(
  statusElement: Locator,
  options: DocumentStatusOptions = DEFAULT_OPTIONS,
) {
  await expect(statusElement).toContainText(documentStatusPatterns.unpublished, {
    useInnerText: options.useInnerText,
    timeout: options.timeout,
  })
}
