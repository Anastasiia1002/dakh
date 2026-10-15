/**
 * Guarded local Vite startup for the public booking flow.
 *
 * Does not read or write env files. Pass --check to validate and exit.
 * If port 5173 is already open, the running dev server is left in place.
 */
import { spawn } from 'node:child_process'
import net from 'node:net'

const CHECK_ONLY = process.argv.includes('--check')
const REQUIRED_MAP = 'bukovyna=e2e-bukovyna,goryshche=e2e-goryshche,plats=e2e-plats'

function fail(message) {
  console.error(`local-booking: ${message}`)
  process.exit(1)
}

function portOpen(port) {
  return new Promise((resolve) => {
    const socket = net.connect({ host: '127.0.0.1', port }, () => {
      socket.end()
      resolve(true)
    })
    socket.on('error', () => resolve(false))
  })
}

const api = process.env.VITE_PUBLIC_API_BASE_URL ?? ''
const hotel = process.env.VITE_PUBLIC_HOTEL_SLUG ?? ''
const roomMap = process.env.VITE_PUBLIC_ROOM_SLUG_MAP ?? ''

if (api !== 'http://localhost:3000/api/public/v1' && api !== 'http://127.0.0.1:3000/api/public/v1') {
  fail('VITE_PUBLIC_API_BASE_URL must be http://localhost:3000/api/public/v1 or http://127.0.0.1:3000/api/public/v1')
}
if (hotel !== 'dakh-e2e-primary') {
  fail('VITE_PUBLIC_HOTEL_SLUG must be dakh-e2e-primary')
}
if (roomMap !== REQUIRED_MAP) {
  fail(`VITE_PUBLIC_ROOM_SLUG_MAP must be ${REQUIRED_MAP}`)
}

console.log(`local-booking: api=${api} hotel=${hotel} rooms=${roomMap}`)

if (CHECK_ONLY) {
  console.log('local-booking: configuration accepted')
  process.exit(0)
}

if (await portOpen(5173)) {
  console.log('local-booking: port 5173 is already accepting connections. Leaving the running dev server in place.')
  process.exit(0)
}

const child = spawn('npm', ['run', 'dev'], { stdio: 'inherit', env: process.env })
child.on('exit', (code) => process.exit(code ?? 1))
