import React from 'react'
import PieChart from 'react-icons/lib/fa/pie-chart'

const IFRAME_STYLE = {
  border: 0,
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  display: 'block',
  boxSizing: 'border-box'

}
export default {
  name: 'bundle',
  title: 'Bundle analyzer',
  icon: PieChart,
  component() {
    return <iframe src="/static/bundle-analyzer-report.html" style={IFRAME_STYLE} />
  }
}
