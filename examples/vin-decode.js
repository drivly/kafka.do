import { QueueConsumer } from 'kafka.do'

export default QueueConsumer({
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      const { vin, nextQueue } = message
      // TODO: get this `decodeVIN` method implemented
      const { squishVIN, year, make, model, trim, style } = await decodeVIN(vin)
      env[nextQueue].send({ vin, squishVIN, year, make, model, trim, style })
    }
  },
})
