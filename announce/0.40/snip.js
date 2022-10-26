
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

const ANNOUNCE_ADDR = '/dns4/example.com/tcp/3000/ws'
const PORT = 3000
const PROTOCOL = '/ipfs/bitswap/1.2.0'

function sleep (ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

async function main() {
  let address
  try {
    // start node
    const node = await createLibp2p({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${PORT}/ws`],
        announce: [ANNOUNCE_ADDR]
      },
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })
    node.handle(PROTOCOL, () => { console.log('node.handle') })
    await node.start()
    console.info(`Node started`, { announce: [ANNOUNCE_ADDR] })

    // connect to node
    const client = await createLibp2p({
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })
    address = `/ip4/127.0.0.1/tcp/${PORT}/ws/p2p/${node.peerId}`

    console.info(`Connecting to ${address} ...`)
    const connection = await client.dial(address)
    console.info(`Connected`)

    console.info(`Acquiring stream ...`)
    const stream = await connection.newStream(PROTOCOL)
    console.info(`Acquired stream`)

    await sleep(500)

    const clientPeer = await client.peerStore.get(node.peerId)
    clientPeer.addresses.forEach((a, i) => {
      console.log(`clientPeer.addresses[${i}]`, a.multiaddr.toString())
    })
    console.log('clientPeer.addresses includes announce addr?',
      clientPeer.addresses.some(a => a.multiaddr.toString().startsWith(ANNOUNCE_ADDR))
    )
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
