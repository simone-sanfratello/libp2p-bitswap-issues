
import fs from 'node:fs/promises'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

// const ANNOUNCE_ADDR = '/dns4/example.com/tcp/3000/ws'

// const ANNOUNCE_ADDR = '/dns4/elastic-dev.dag.house/tcp/443/wss'
// const ANNOUNCE_ADDR = '/dns4/elastic-staging.dag.house/tcp/443/wss'

const ANNOUNCE_ADDR = '/dns4/elastic.dag.house/tcp/443/wss'

const PORT = 3000
const PROTOCOL = '/ipfs/bitswap/1.2.0'

function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

async function main() {
  let address
  try {
    const server = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${PORT}/ws`],
        announce: [ANNOUNCE_ADDR]
      },
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })
    server.handle(PROTOCOL, () => { })

    // server.peerStore.addEventListener('change:protocols', (event) => {
    //   console.log('change:protocols', event.detail.protocols.join())
    // })
    
    await server.start()

    address = `/ip4/127.0.0.1/tcp/${PORT}/ws/p2p/${server.peerId}`

    fs.writeFile('/tmp/debug-libp2p', address, 'utf8')

    // server.stop()
  } catch (err) {
    console.error('! Error ', { address })
    console.error(err)
    if (err.errors) {
      for (const e of err.errors) {
        console.error(e)
      }
    }
  }
}

main()
