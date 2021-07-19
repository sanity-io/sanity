import React from 'react'
import { ResponsiveBar as Bar } from '@nivo/bar'

const ResponsiveBar = ({ data, indexBy, keys, showLegends, xLegend, yLegend }) => {
  // const getBarColor = bar => bar.data.color
  return <Bar
    data={data}
    keys={keys}
    indexBy={indexBy}
    margin={{ top: showLegends ? 70 : 30, right: 15, bottom: 50, left: 60 }}
    padding={0.3}
    colors={['#6da4fd', '#FBF78E', '#77df83']}
    borderColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
    axisTop={null}
    axisRight={null}
    axisBottom={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: xLegend,
      legendPosition: 'middle',
      legendOffset: 32
    }}
    axisLeft={{
      tickSize: 5,
      tickPadding: 5,
      tickRotation: 0,
      legend: yLegend,
      legendPosition: 'middle',
      legendOffset: -40
    }}
    labelSkipWidth={12}
    labelSkipHeight={12}
    labelTextColor={{ from: 'color', modifiers: [ [ 'darker', 1.6 ] ] }}
    legends={showLegends && [
      {
        dataFrom: 'keys',
        anchor: 'top-right',
        direction: 'row',
        justify: false,
        translateX: 0,
        translateY: -40,
        itemsSpacing: 2,
        itemWidth: 100,
        itemHeight: 20,
        itemDirection: 'left-to-right',
        itemOpacity: 0.85,
        symbolSize: 20,
        effects: [
          {
            on: 'hover',
            style: {
              itemOpacity: 1
            }
          }
        ]
      }
    ]}
    animate={true}
    motionStiffness={90}
    motionDamping={15}
  />
}

export default ResponsiveBar
