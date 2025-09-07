import { testProvider } from './actions/ether-provider'

async function main() {
  console.log('Testing Ether Provider...')
  const result = await testProvider()

  if (result.success) {
    console.log('✅ SUCCESS!')
    console.log(`Network: ${result.network}`)
    console.log(`Chain ID: ${result.chainId}`)
    console.log(`Block Number: ${result.blockNumber}`)
  } else {
    console.log('❌ FAILED!')
    console.log(`Error: ${result.error}`)
  }
}

main().catch(console.error)
