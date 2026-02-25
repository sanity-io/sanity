import {raise} from '@portabletext/editor/behaviors'
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
          raise({
            type: 'annotation.add',
            annotation: createLinkAnnotation(normalizeHref(match.text)),
          }),
        ])

        const lastMatch = event.matches[event.matches.length - 1]
        const endPosition = {
          path: event.focusBlock.path,
          offset: lastMatch.targetOffsets.focus.offset,
        }

        return [
          ...selectAndAnnotate,
          raise({type: 'select', at: {anchor: endPosition, focus: endPosition}}),
        ]
      },
    ],
  })
}

export function AutoLinkPlugin(): JSX.Element {
  return <InputRulePlugin rules={[createAutoLinkRule()]} />
}
