/**
 * Guarded local Vite startup for the public booking flow.
 *
 * Does not read or write env files. Pass --check to validate and exit.
 * If port 5173 is already open, the running dev server is left in place.
 */
import { spawn } from 'node:child_process'
import net from 'node:net'

const CHECK_ONLY = process.argv.includes('--check')
const STAGING_APIS = new Set([
  'http://localhost:3000/api/public/v1',
  'http://127.0.0.1:3000/api/public/v1',
  'http://localhost:3001/api/public/v1',
  'http://127.0.0.1:3001/api/public/v1',
])

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
const booking = process.env.VITE_BOOKING_ENABLED ?? ''
const hotelMap = process.env.VITE_ACCOMMODATION_HOTEL_MAP ?? ''

if (!STAGING_APIS.has(api)) {
  fail('VITE_PUBLIC_API_BASE_URL must be the local API on port 3000 or the QA API on 127.0.0.1:3001')
}
if (booking !== 'true') {
  fail('VITE_BOOKING_ENABLED must be exactly true for this local process. Do not point it at production.')
}
if (hotelMap !== 'split' && hotelMap !== 'merged') {
  fail('VITE_ACCOMMODATION_HOTEL_MAP must be exactly split or merged.')
}
if (api.includes(':3001/') && hotelMap !== 'merged') {
  fail('The QA API on port 3001 already serves cottages from dakh. Set VITE_ACCOMMODATION_HOTEL_MAP=merged.')
}

console.log(`local-booking: api=${api} booking=local-only`)

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
