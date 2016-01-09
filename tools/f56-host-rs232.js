'use strict'

const serialPort = require('serialport')
const SerialPort = serialPort.SerialPort
const EventEmitter = require('events')
const fsm = require('../lib/f56/f56-fsm')

const serialOptions = {baudRate: 9600, parity: 'even', dataBits: 8, stopBits: 1}

class Emitter extends EventEmitter {}
const emitter = new Emitter()

var serial

function create (device) {
  serial = new SerialPort(device, serialOptions, false)

  return new Promise((resolve, reject) => {
    serial.open(error => {
      if (error) return reject(error)

      console.log('INFO Connected')
      serial.on('data', data => parse(data))
      serial.on('close', () => emitter.emit('disconnected'))
      resolve()
    })
  })
}

function parse (buf) {
  console.log(buf.toString('hex'))
  for (let byte of buf) {
    fsm.rx(byte)
  }
}

fsm.on('frame', processFrame)

fsm.on('send', s => {
  console.log('sending: %s', prettyHex(s))
  serial.write(s)
})

const device = process.argv[2]
create(device)
.then(console.log)

function processFrame (frame) {
  console.log(prettyHex(frame))
}

function prettyHex (buf) {
  const pairs = []
  for (let i = 0; i < buf.length; i++) {
    pairs.push((buf.slice(i, i + 1).toString('hex')))
  }

  return pairs.join(' ')
}

function parity(x) {
   let y
   y = x ^ (x >> 1)
   y = y ^ (y >> 2)
   y = y ^ (y >> 4)
   y = y ^ (y >> 8)
   y = y ^ (y >>16)
   return x + (y & 1) * 0x80
}
