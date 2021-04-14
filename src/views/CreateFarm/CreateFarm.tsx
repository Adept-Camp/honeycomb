import React, { useState, useCallback, useEffect } from 'react'

import useSushi from '../../hooks/useSushi'
import useCreatePool from '../../hooks/useCreatePool'
import { ZERO_ADDRESS } from '../../constants'

import { useQuery } from '@apollo/client'
import { honeyswapClient } from '../../apollo/clients'
import { GET_PAIR } from '../../apollo/queries'

import aclogo from '../../assets/img/mmorelightlogo.png'

import PageHeader from '../../components/PageHeader'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Spacer from '../../components/Spacer'

import PairInformation from './components/PairInformation'

// TODO: Send transaction
// TODO: Display pool address and funding address
const CreateFarm: React.FC = () => {
  const sushi = useSushi()

  // Input handler
  const [pairAddress, setPairAddress] = useState<string>()
  const handleChange = useCallback(
    (e: React.FormEvent<HTMLInputElement>) => {
      setPairAddress(e.currentTarget.value)
    },
    [setPairAddress],
  )

  // Address validation
  const [isValidAddress, setIsValidAddress] = useState(false)
  useEffect(() => {
    setIsValidAddress(
      pairAddress
      && pairAddress.startsWith('0x')
      && pairAddress.length === 42
    )
  }, [pairAddress])

  // Pool existence check
  const [poolExists, setPoolExists] = useState(false)
  useEffect(() => {
    async function fetchPairInformation() {
      const {
        pool: poolAddress
      } = await sushi.contracts.factory.methods.pools(pairAddress).call()

      setPoolExists(poolAddress !== ZERO_ADDRESS)
    }

    if (isValidAddress) {
      fetchPairInformation()
    } // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidAddress])

  // Honeyswap pair data
  const { data: pairData, loading } = useQuery(GET_PAIR, {
    client: honeyswapClient,
    variables: { pair: pairAddress }
  })

  // Transaction handling
  const [poolCreated, setPoolCreated] = useState(false)
  const [pendingTx, setPendingTx] = useState(false)
  const { onCreate } = useCreatePool()
  console.log("Addr: %s, Pend: %s, pair: %s", pairAddress, pendingTx, (pairData && !pairData.pair))
  // UniswapV2Router01 ToDo find it automatically 
  const routerAddress = "0x3BF6aDB5F2b24A1E6A15c3CbD98f8c0d87787177"

  if (poolCreated) {
    return (
      <>
        <PageHeader
          icon={<img src={aclogo} height="95" alt="" />}
          subtitle="The farm has been created. It might take a little while until it shows up on Honeycomb."
          title="Farm Created"
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        icon={<img src={aclogo} height="95" alt="" />}
        subtitle="Create a new farm for a Honeyswap pair"
        title="Create Farm"
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          maxWidth: '900px',
          width: '100%'
        }}
      >
        <Input
          placeholder="Pair address"
          onChange={handleChange}
          value={pairAddress}
        />
        <Spacer/>
        <PairInformation
          data={pairData?.pair}
          hasPool={poolExists}
        />
        <Button
          disabled={
            loading
            || pendingTx
            || !isValidAddress
            || poolExists
            || (pairData && !pairData.pair)
          }
          onClick={async () => {
            setPendingTx(true)
            await onCreate(pairAddress, routerAddress)
            setPendingTx(false)
            setPoolCreated(true)
          }}
          text={pendingTx ? "Creating farm..." : "Create"}
        />
      </div>
    </>
  )
}

export default CreateFarm
