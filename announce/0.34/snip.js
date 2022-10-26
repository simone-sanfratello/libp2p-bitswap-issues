'use strict'

const { Noise } = require('@web3-storage/libp2p-noise')
const libp2p = require('libp2p')
const Multiplex = require('libp2p-mplex')
const Websockets = require('libp2p-websockets')

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
    const node = await libp2p.create({
      addresses: {
        listen: [`/ip4/0.0.0.0/tcp/${PORT}/ws`],
        announce: [ANNOUNCE_ADDR]
      },
      modules: {
        transport: [Websockets],
        streamMuxer: [Multiplex],
        connEncryption: [new Noise()]
      }
    })
    node.handle(PROTOCOL, () => { console.log('node.handle') })
    await node.start()
    console.info(`Node started`, { announce: [ANNOUNCE_ADDR] })

    // connect to node
    const client = await libp2p.create({
      modules: {
        transport: [Websockets],
        streamMuxer: [Multiplex],
        connEncryption: [new Noise()]
      }
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
