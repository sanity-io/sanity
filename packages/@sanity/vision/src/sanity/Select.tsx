import React from 'react'
import FaAngleDown from 'part:@sanity/base/angle-down-icon'
import Dropdown from '../components/Dropdown'
import styles from '../css/select.css'

function Select(props) {
  return (
    <div className={styles.selectContainer}>
      <Dropdown className={styles.select} {...props} />
      <div className={styles.functions}>
        <div className={styles.icon}>
          <FaAngleDown color="inherit" />
        </div>
      </div>
    </div>
  )
}

export default Select
