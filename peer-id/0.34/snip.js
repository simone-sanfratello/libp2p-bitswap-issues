
'use strict'

const fs = require('fs/promises')
const path = require('path')
const { Noise } = require('@web3-storage/libp2p-noise')
const libp2p = require('libp2p')
const Multiplex = require('libp2p-mplex')
const Websockets = require('libp2p-websockets')
const PeerId = require('peer-id')

const PEER_ID_JSON_FILE = path.join(__dirname, '../peer-id.json')
const PORT = 3000
const PROTOCOL = '/ipfs/bitswap/1.2.0'

async function startNode() {
  let peerId

  // create peer from json
  try {
    const peerIdJson = JSON.parse(await fs.readFile(PEER_ID_JSON_FILE, 'utf-8'))
    peerId = await PeerId.createFromJSON(peerIdJson)
    console.info('peerId loaded from JSON ' + PEER_ID_JSON_FILE)
  } catch (err) {
    console.error('! Cant load peer file from ' + PEER_ID_JSON_FILE, err)
  }

  // start node
  const node = await libp2p.create({
    peerId,
    addresses: {
      listen: [`/ip4/0.0.0.0/tcp/${PORT}/ws`]
    },
    modules: {
      transport: [Websockets],
      streamMuxer: [Multiplex],
      connEncryption: [new Noise()]
    }
  })
  node.handle(PROTOCOL, () => { console.log('node.handle') })
  await node.start()
  console.info(
    { address: node.transportManager.getAddrs() },
    `BitSwap peer started with PeerId ${node.peerId} and listening on port ${PORT}`
  )
  return node
}

async function connectToNode(node) {
  let address, client
  try {
    client = await libp2p.create({
      modules: {
        transport: [Websockets],
        streamMuxer: [Multiplex],
        connEncryption: [new Noise()]
      }
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
