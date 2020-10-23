import React from 'react'
import defaultResolve from 'part:@sanity/base/document-actions'

import {
  ConfirmDialogAction,
  ModalDialogAction,
  PopoverDialogAction,
} from './test-action-tool/actions/DialogActions'

const useInterval = (ms) => {
  const [tick, setTick] = React.useState(0)
  React.useEffect(() => {
    const intervalId = setInterval(() => setTick((t) => t + 1), ms)
    return () => clearInterval(intervalId)
  }, [ms])
  return tick
}

function TickAction() {
  const tick = useInterval(10)
  return {
    label: `A custom action / ${tick}`,
    title: `An action that doesn't do anything particular`,
  }
}

function StaticAction() {
  return {
    label: `A custom static action`,
    title: `An action that doesn't do anything particular`,
  }
}

function OnlyWhenPublishedAction(props) {
  return {
    label: `Document is published`,
  }
}

export default function resolveDocumentActions(props) {
  // return defaultResolve(props)
  return [
    ...defaultResolve(props),
    // StaticAction,
    // TestAction,
    props.published ? OnlyWhenPublishedAction : null,
    PopoverDialogAction,
    ModalDialogAction,
    ConfirmDialogAction,
  ].filter(Boolean)
}
