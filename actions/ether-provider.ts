// app/actions/web3.ts
'use server'

import { ethers } from 'ethers'

const provider = new ethers.JsonRpcProvider(
  process.env.INFURA_ARBITRUM_RPC_URL || 'https://arb1.arbitrum.io/rpc'
)

// Test function to verify provider connection
export async function testProvider() {
  try {
    const network = await provider.getNetwork()
    const blockNumber = await provider.getBlockNumber()
    return {
      success: true,
      network: network.name,
      chainId: network.chainId,
      blockNumber: blockNumber
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}

