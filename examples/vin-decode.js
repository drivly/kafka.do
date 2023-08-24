import { QueueConsumer } from '@drivly/kafka.do'

export default QueueConsumer({
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const { vin, nextQueue } = message
      const { squishVIN, year, make, model, style } = await decodeVIN(vin)
      if (nextQueue) {
        if (!env[nextQueue]?.send) {
          console.error(`The Queue ${nextQueue} is not currently configured in the env`)
        } else {
          env[nextQueue].send({ vin, squishVIN, year, make, model, style })
        }
      }
    }
  },
})

let squishVins
async function decodeVIN(vin) {
  if (!squishVins) squishVins = await fetch('https://vehicles.do/ymms.json').then((res) => res.json())
  const vinFormatted = vin?.match(/^[1-9A-HJ-NPR-Z][0-9A-HJ-NPR-Z]{7}[0-9X][0-9A-HJ-NPR-Z]{8}$/)
  const squishVIN = vinFormatted ? vin.slice(0, 8) + vin.slice(9, 11) : undefined
  const [year, make, model, style] = (squishVIN && squishVins[squishVIN]?.split('|')) || []
  return { squishVIN, year, make, model, style }
}
