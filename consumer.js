import { UpstashKafka } from './worker'

const QueueConsumer = (workerClass, queue) => {
  workerClass.scheduled = (event, env, ctx) => {
    // create the DO instances
  }
  workerClass.alarm = async (env, ctx) => {
    // do a long poll of the Upstash API
    const kafka = new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD)
    const results = await kafka.queue(queue || env.QUEUE_NAME)
    const event = {
      queue: queue || env.QUEUE_NAME,
      messages: results.map((result) => {
        return {
          id: result.offset, // TODO: map this correctly
          timestamp: result.timestamp, // TODO: map this correctly
          body: result.value, // TODO: map this correctly
          ack: () => {
            // TODO: figure out the logic to `ack` this message
          },
          retry: () => {
            // TODO: figure out the logic to `retry` this message
          },
        }
      }),
    }
    // This is where we're translating the pull from upstash into a push for simple and easy-to-create PubSub nano-services on Cloudflare
    await workerClass.queue(event, env, ctx)
  }
  return workerClass
}

export default {
  async scheduled(event, env, ctx) {
    // TODO: Create `maxConcurrency` number of DO instances, and ensure they each have an alarm set at `maxBatchTimeout`
  },

  async queue() {},
}

class KafkaConsumer {
  constructor(ctx, env) {
    // Create alarms based on the settings
  }

  async fetch(req) {}

  async alarm() {}
}
export { KafkaConsumer, QueueConsumer }
