
import fs from 'fs/promises'
import url from 'url'
import path from 'path'
import { createFromJSON } from '@libp2p/peer-id-factory'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

function dirname() {
  return path.dirname(url.fileURLToPath(import.meta.url))
}

const PEER_ID_JSON_FILE = path.join(dirname(), '../peer-id.json')
const PORT = 3000
const PROTOCOL = '/ipfs/bitswap/1.2.0'

async function startNode() {
  let peerId

  // create peer from json
  try {
    const peerIdJson = JSON.parse(await fs.readFile(PEER_ID_JSON_FILE, 'utf-8'))
    peerId = await createFromJSON(peerIdJson)
    console.info('peerId loaded from JSON ' + PEER_ID_JSON_FILE)

  } catch (err) {
    console.error('! Cant load peer file from ' + PEER_ID_JSON_FILE, err)
  }

  // start node
  const node = await createLibp2p({
    peerId,
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${PORT}/ws`],
    },
    transports: [webSockets()],
    connectionEncryption: [noise()],
    streamMuxers: [mplex()]
  })
  node.handle(PROTOCOL, () => { console.log('node.handle') })
  await node.start()
  console.info(`Node started`)

  return node
}

async function connectToNode(node) {
  let address, client
  try {
    client = await createLibp2p({
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })
    // new address
    address = `/ip4/127.0.0.1/tcp/${PORT}/ws/p2p/${node.peerId}`
    console.info(`Connecting to ${address} ...`)
    let connection = await client.dial(address)

    console.info(`Connected to ${address}`)
    let stream = await connection.newStream(PROTOCOL)

    // old address
    address = `/ip4/127.0.0.1/tcp/${PORT}/ws/p2p/bafzbeia6mfzohhrwcvr3eaebk3gjqdwsidtfxhpnuwwxlpbwcx5z7sepei`
    console.info(`Connecting to ${address} ...`)
    connection = await client.dial(address)

    console.info(`Connected to ${address}`)
    stream = await connection.newStream(PROTOCOL)
  } catch (err) {
    console.error('! Cant connect to node ' + address)
    console.error(err)
    if (err.errors) {
      for (const e of err.errors) {
        console.error(e)
      }
    }
  }
}

async function main() {
  const node = await startNode()
  await connectToNode(node)
}

main()
