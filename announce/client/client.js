
import fs from 'node:fs/promises'
import { createLibp2p } from 'libp2p'
import { webSockets } from '@libp2p/websockets'
import { noise } from '@chainsafe/libp2p-noise'
import { mplex } from '@libp2p/mplex'

// const ANNOUNCE_ADDR = '/dns4/example.com/tcp/3000/ws'

// const ANNOUNCE_ADDR = '/dns4/elastic-dev.dag.house/tcp/443/wss'
// const ANNOUNCE_ADDR = '/dns4/elastic-staging.dag.house/tcp/443/wss'

const ANNOUNCE_ADDR = '/dns4/elastic.dag.house/tcp/443/wss'

const PROTOCOL = '/ipfs/bitswap/1.2.0'

function sleep(ms) {
  return new Promise(resolve => { setTimeout(resolve, ms) })
}

async function connect(address) {
  if(!address) {return}
  try {
    // connect to node
    const client = await createLibp2p({
      transports: [webSockets()],
      connectionEncryption: [noise()],
      streamMuxers: [mplex()]
    })

    console.log(' ------------------------------- CONNECT -----------------------------')

    console.info(` /// client.dial`, address)
    let connection = await client.dial(address)
    await sleep(100)

    console.info(` /// connection.newStream`, PROTOCOL)
    const stream = await connection.newStream(PROTOCOL)

    await sleep(100)

    const clientPeer = await client.peerStore.get(connection.remotePeer)
    clientPeer.addresses.forEach((a, i) => {
      console.log(`\n    clientPeer.addresses[${i}]`, a.multiaddr.toString())
    })
    // console.log('clientPeer.addresses includes announce addr?',
    //   clientPeer.addresses.some(a => a.multiaddr.toString().startsWith(ANNOUNCE_ADDR))
    // )

    console.log(' ------------------------------- CLOSE -----------------------------')

    connection.close()
    client.stop()

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

async function main() {
  const ac = new AbortController();
  const { signal } = ac;
  // setTimeout(() => ac.abort(), 10000);  

  const address = await fs.readFile('/tmp/debug-libp2p', 'utf8')
  connect(address)

  const watcher = fs.watch('/tmp/debug-libp2p', { signal });
  for await (const event of watcher) {
    // console.log(event);
    const address = await fs.readFile('/tmp/debug-libp2p', 'utf8')
    connect(address)
  }
}

main()
