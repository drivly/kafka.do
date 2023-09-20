import { KafkaConsumer as UpstashKafka } from './UpstashKafka'

export const QueueConsumer = (workerClass, queue) => {
  workerClass.scheduled = async (event, env, ctx) => {
    // create the DO instances
  }
  workerClass.alarm = async (env, ctx) => {
    // do a long poll of the Upstash API
    const kafka = new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD, queue || env.QUEUE_NAME)
    const results = await kafka.queue()
    const event = {
      queue,
      messages: results.map((result) => {
        return {
          id: result.offset,
          timestamp: result.timestamp,
          body: result.value,
          ack: async () => {
            await kafka.ack(result.offset)
          },
          retry: () => {
            // TODO: figure out the logic to `retry` this message
          },
        }
      }),
      ackAll: async () => {
        await kafka.ackAll()
      },
      retryAll: () => {
        event.messages.forEach((message) => message.retry())
      },
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

  async queue(batch, env, ctx) {},
}

export class KafkaConsumer {
  state
  constructor(state, env) {
    this.state = state
    // Create alarms based on the settings
    this.state.storage.setAlarm(Date.now() + 10 * 1000)
  }

  async fetch(request) {}

  async alarm() {
    this.state.storage.setAlarm(Date.now() + 10 * 1000)
  }
}
