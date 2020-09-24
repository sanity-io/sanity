import React from 'react'
import {DiffCard, ObjectDiff} from '../../../../diff'
import styles from './Decorator.css'

export default function Decorator({
  diff,
  mark,
  text,
  children
}: {
  diff: ObjectDiff
  mark: string
  text: string
  children: JSX.Element
}) {
  let returned = children
  const marksDiff = findMarksDiff(diff, mark, text)
  const isRemoved = marksDiff && marksDiff.action === 'removed'
  if (marksDiff && marksDiff.action !== 'unchanged') {
    returned = (
      <DiffCard
        annotation={marksDiff.annotation}
        as="span"
        tooltip={{description: `Formatting ${marksDiff.action}`}}
      >
        {returned}
      </DiffCard>
    )
  }
  if (!isRemoved) {
    returned = <span className={`${styles[mark]}`}>{children}</span>
  }
  return returned
}

function findMarksDiff(diff: ObjectDiff, mark: string, text: string) {
  const spanDiff =
    diff.fields.children &&
    diff.fields.children.action === 'changed' &&
    diff.fields.children.type === 'array' &&
    (diff.fields.children.items.find(
      // TODO: could this be done better? We cant exact match on string as they may be broken apart.
      // Check for indexOf string for now
      // eslint-disable-next-line complexity
      item =>
        item.diff &&
        item.diff.type === 'object' &&
        item.diff.fields.marks &&
        item.diff.fields.marks.type === 'array' &&
        item.diff.fields.text &&
        item.diff.fields.text.type === 'string' &&
        ((item.diff.fields.text.toValue && item.diff.fields.text.toValue.indexOf(text) > -1) ||
          (item.diff.fields.text.fromValue &&
            item.diff.fields.text.fromValue.indexOf(text) > -1)) &&
        ((Array.isArray(item.diff.fields.marks.toValue) &&
          item.diff.fields.marks.toValue.includes(mark)) ||
          (Array.isArray(item.diff.fields.marks.fromValue) &&
            item.diff.fields.marks.fromValue.includes(mark)))
    )?.diff as ObjectDiff)
  return (
    spanDiff &&
    spanDiff.fields.marks &&
    spanDiff.fields.marks.type === 'array' &&
    spanDiff.fields.marks.action !== 'unchanged' &&
    spanDiff.fields.marks.items.find(
      item => item.diff.toValue === mark || item.diff.fromValue === mark
    )?.diff
  )
}
