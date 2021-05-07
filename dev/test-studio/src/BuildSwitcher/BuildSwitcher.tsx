import React, {useEffect, useState} from 'react'
import {MenuButton, Button, Menu, MenuItem, MenuDivider, Layer} from '@sanity/ui'
import {CircleIcon, CheckmarkCircleIcon} from '@sanity/icons'
import {metricsStudioClient} from './metricsClient'

function fetchBuildHistory() {
  return metricsStudioClient.fetch(
    '*[_type=="branch"] | order(updatedAt desc) | {_id, name, "latestDeployment": *[_type == "deployment" && name=="test-studio" && references(^._id)][0]}'
  )
}

const COLORS = {
  success: '#4fd97f',
  pending: '#f5a623',
  error: '#f46e64',
}
function getDeploymentStatusColor(deployment: any) {
  if (!deployment) {
    return undefined
  }
  if (deployment?.status === 'pending') {
    return COLORS.pending
  }
  if (deployment?.status === 'completed') {
    return COLORS.success
  }
  if (deployment?.status === 'error') {
    return COLORS.error
  }
  return 'white'
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
          type="button"
          mode="bleed"
          text={isLocal ? <>Localhost</> : <>{currentBranch?.name || 'unknown branch'}</>}
        />
      }
      id="menu-button-example"
      portal
      menu={
        <Menu>
          {branches.map((branch) => {
            return (
              <MenuItem
                as="a"
                icon={() => <CircleIcon fill={getDeploymentStatusColor(branch.latestDeployment)} />}
                key={branch.name}
                target="_blank"
                rel="noopener noreferrer"
                href={`https://${branch.latestDeployment.url}${document.location.pathname}`}
                text={<>{branch.name}</>}
              />
            )
          })}
        </Menu>
      }
    />
  )
}
