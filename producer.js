import { UpstashKafka } from './UpstashKafka'

export const QueueProducer = (queue, env) => {
  if (!queue) queue = env.QUEUE_NAME
  if (!env[queue]) {
    env[queue] = {
      kafka: new UpstashKafka(env.QUEUE_SERVER, env.QUEUE_USERNAME, env.QUEUE_PASSWORD),
      send: async (message) => {
        return await env[queue].kafka.send(message.body || message)
      },
      sendBatch: async (messages) => {
        return await env[queue].kafka.sendBatch(messages.map((m) => m.body || m))
      },
    }
    env[queue].kafka.queueName = queue
  }
}
