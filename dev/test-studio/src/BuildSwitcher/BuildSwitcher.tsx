import React, {useEffect, useState} from 'react'
import {metricsStudioClient} from './metricsClient'
import {MenuButton, Button, Menu, MenuItem, MenuDivider, Layer} from '@sanity/ui'

function fetchBuildHistory() {
  return metricsStudioClient.fetch(
    '*[_type=="branch"] | order(updatedAt desc) | {_id, name, "latestDeployment": *[_type == "deployment" && references(^._id)][0]}'
  )
}

export function BuildSwitcher() {
  const [branches, setBranches] = useState([])
  useEffect(() => {
    fetchBuildHistory().then((result) => {
      setBranches(result)
    })
  }, [])

  // const selected = branches.find
  const isLocal = LOCAL_HOSTS.includes(document.location.hostname)

  const currentBranch = branches.find(
    (branch) => branch.latestDeployment?.url === document.location.hostname
  )
  console.log(branches)

  return (
    <MenuButton
      button={
        <Button
          mode="bleed"
          text={isLocal ? <>Localhost</> : <>{currentBranch?.name || 'unknown branch'}</>}
        />
      }
      id="menu-button-example"
      portal
      menu={
        <Menu>
          {branches.map((branch) => (
            <MenuItem
              key={branch.name}
              onClick={() =>
                (document.location.href = `https://${branch.latestDeployment.url}${document.location.pathname}`)
              }
              text={<>{branch.name}</>}
            />
          ))}
        </Menu>
      }
    />
  )
}
