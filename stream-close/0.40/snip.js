
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

const ANNOUNCE_ADDR = '/dns4/example.com/tcp/3000/ws'
const PORT = 3000
const PROTOCOL = '/ipfs/bitswap/1.2.0'

function sleep(ms) {
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

    connection.close()
    client.stop()
    // stream.close()

    await sleep(10)

    const peerConnections = Array.from(node.connectionManager.connections.entries())
    console.log('node should have only 1 peer with connections', peerConnections.length)

    const peerConnection = peerConnections[0]
    if (peerConnection) {
      const [, connnections] = peerConnection
      console.log('node should have 1 connection to client, got', connnections.length)

      const streams = connnections[0].streams
      console.log('node should have 0 open streams to client, got', streams.length)
    }
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
