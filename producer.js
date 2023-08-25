import { UpstashKafka } from './UpstashKafka'

export const QueueProducer = (queue, env) => {
  env[queue] = {
    kafka: new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD),
    send: async (message) => {
      return await env[queue].kafka.send(message.body)
    },
    sendBatch: async (messages) => {
      return await env[queue].kafka.sendBatch(messages.map((m) => m.body))
    },
  }
  env[queue].kafka.queueName = queue || env.QUEUE_NAME
}
