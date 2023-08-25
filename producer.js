import { UpstashKafka } from './UpstashKafka'

const QueueProducer = (queue, env) => {
  env[queue] = {
    kafka: new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD),
    send: async (message) => {
      return await env[queue].kafka.send(queue, message)
    },
    sendBatch: async (messages) => {
      return await env[queue].kafka.sendBatch(queue, messages)
    },
  }
}

export { QueueProducer }
