import { KafkaProducer } from './UpstashKafka'

export const QueueProducer = (queue, env) => {
  if (!queue) queue = env.QUEUE_NAME
  if (!env[queue]) {
    env[queue] = {
      kafka: new KafkaProducer(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD, queue),
      send: async (message) => {
        return await env[queue].kafka.send(message.body || message)
      },
      sendBatch: async (messages) => {
        return await env[queue].kafka.sendBatch(Array.isArray(messages) ? messages.map((m) => m.body || m) : messages.body || messages)
      },
    }
  }
}
