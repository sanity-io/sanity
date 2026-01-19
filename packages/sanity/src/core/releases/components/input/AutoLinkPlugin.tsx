import {defineBehavior, raise} from '@portabletext/editor/behaviors'
import {BehaviorPlugin} from '@portabletext/editor/plugins'
import {defineInputRule, InputRulePlugin} from '@portabletext/plugin-input-rule'
import {randomKey} from '@sanity/util/content'
import {type JSX} from 'react'

const URL_REGEX =
  /(?:https?:\/\/(?:www\.)?|www\.)(?:[-\w.]+(?::[0-9]+)?|localhost(?::[0-9]+)?)(?:\/[-\w@:%+.~#?&/=]*)?/gi

function normalizeHref(url: string): string {
  return url.startsWith('www.') ? `https://${url}` : url
}

function createLinkAnnotation(href: string) {
  return {
    name: 'link',
    value: {_type: 'link', _key: randomKey(12), href},
  }
}

function createAutoLinkRule() {
  return defineInputRule({
    on: URL_REGEX,
    actions: [
      ({event}) => {
        const selectAndAnnotate = event.matches.flatMap((match) => [
          raise({type: 'select', at: match.targetOffsets}),
          raise({type: 'annotation.add', annotation: createLinkAnnotation(normalizeHref(match.text))}),
        ])

        const lastMatch = event.matches[event.matches.length - 1]
        const endPosition = {path: event.focusBlock.path, offset: lastMatch.targetOffsets.focus.offset}

        return [...selectAndAnnotate, raise({type: 'select', at: {anchor: endPosition, focus: endPosition}})]
      },
    ],
  })
}

function createPasteAutoLinkBehavior() {
  return defineBehavior({
    on: 'clipboard.paste',
    actions: [
      (event: any) => {
        const pastedText = event.event?.originEvent?.dataTransfer?.getData('text')
        if (pastedText === null || pastedText === undefined || pastedText === '') {
          return []
        }

        const urls = pastedText.match(URL_REGEX)
        const selection = event.snapshot?.selection
        const isSingleUrl = urls?.length === 1 && pastedText.trim() === urls[0]

        if (selection === null || selection === undefined) {
          return [raise({type: 'insert.text', text: pastedText})]
        }

        if (isSingleUrl) {
          const {path, offset} = selection.focus
          const endOffset = offset + pastedText.length

          return [
            raise({type: 'insert.text', text: pastedText}),
            raise({type: 'select', at: {anchor: {path, offset}, focus: {path, offset: endOffset}, backward: false}}),
            raise({type: 'annotation.add', annotation: createLinkAnnotation(normalizeHref(urls[0]))}),
            raise({type: 'select', at: {anchor: {path, offset: endOffset}, focus: {path, offset: endOffset}}}),
          ]
        }

        return [raise({type: 'insert.text', text: pastedText})]
      },
    ],
  })
}

export function AutoLinkPlugin(): JSX.Element {
  return (
    <>
      <InputRulePlugin rules={[createAutoLinkRule()]} />
      <BehaviorPlugin behaviors={[createPasteAutoLinkBehavior()]} />
    </>
  )
}
