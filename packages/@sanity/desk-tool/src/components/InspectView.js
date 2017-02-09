import React, {PropTypes} from 'react'
import './styles/JSONInspector.css'
import styles from './styles/InspectView.css'
import JSONInspector from 'react-json-inspector'
import DefaultDialog from 'part:@sanity/components/dialogs/default'
import {isObject} from 'lodash'
import HLRU from 'hashlru'

// Fix due to falsey-check for key existence in HLRU
// todo: submit pr

function BoolLRU(limit) {
  const FALSE = {}
  const lru = HLRU(limit)

  function toFakeBool(val) {
    return val ? true : FALSE
  }

  function toBool(cachedVal) {
    return cachedVal === FALSE ? false : cachedVal
  }

  return {
    get(key) {
      return toBool(lru.get(key))
    },
    set(key, val) {
      return lru.set(key, toFakeBool(val))
    }
  }
}

const lru = BoolLRU(1000)

function isExpanded(keyPath, value) {
  const cached = lru.get(keyPath)
  if (cached === undefined) {
    lru.set(keyPath, Array.isArray(value) || isObject(value))
    return isExpanded(keyPath, value)
  }
  return cached
}

function toggleExpanded(event) {
  const {path} = event
  const current = lru.get(path)
  if (current === undefined) {
    // something is wrong
    return
  }
  lru.set(path, !current)
}

export default function InspectView(props) {
  return (
    <DefaultDialog
      isOpen
      showHeader
      title={`Inspecting ${props.value._id}`}
      className={styles.dialog}
      onClose={props.onClose}
    >
      <JSONInspector
        isExpanded={isExpanded}
        onClick={toggleExpanded}
        data={props.value}
      />
    </DefaultDialog>
  )
}

InspectView.propTypes = {
  value: PropTypes.object,
  onClose: PropTypes.func
}
