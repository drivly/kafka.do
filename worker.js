import { Router, json } from 'itty-router'
import { Kafka } from '@upstash/kafka'

const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(req).then((res) => res.json())
  if (!request.ctx.user) {
    return Response.redirect('/login')
  }
  request.api = {
    icon: '🌎',
    name: 'kafka.do',
    description: 'Cloudflare Worker API for Kafka with webhooks',
    url: 'https://kafka.do',
    endpoints: {
      topics: request.ctx.origin + '/topics',
      producer: request.ctx.origin + '/producer/:topic/:message',
      consumer: request.ctx.origin + '/consumer/:topic',
      consumerBulk: request.ctx.origin + '/consumer/:topic/:count',
      fetch: request.ctx.origin + '/fetch/:topic',
      fetchBulk: request.ctx.origin + '/fetch/:topic/:count',
    },
    memberOf: 'https://apis.do/pubsub',
    login: request.ctx.origin + '/login',
    logout: request.ctx.origin + '/logout',
    repo: 'https://github.com/drivly/kafka.do',
  }
  request.kafkaConfig = {
    url: env.KAFKA_URL,
    username: env.KAFKA_USERNAME,
    password: env.KAFKA_PASSWORD,
  }
}

const router = Router()

router.get('/topics', async (request) => {
  const kafka = new Kafka(request.kafkaConfig)
  const admin = kafka.admin()

  try {
    const topics = await admin.topics()
    return json({ api: request.api, topics, user: request.ctx.user }, { status: 200 })
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

router.get('/producer/:topic/:message', async (request) => {
  const { topic, message } = request.params
  const kafka = new Kafka(request.kafkaConfig)
  const producer = kafka.producer()

  try {
    const res = await producer.produce(topic, message)

    return json({ api: request.api, topic, message, offset: res.result.baseOffset, user: request.ctx.user }, { status: 200 })
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

async function consumeMessages(topic, groupId) {
  const kafka = new Kafka(request.kafkaConfig)
  const consumer = kafka.consumer()

  try {
    const messages = await consumer.consume({
      consumerGroupId: groupId,
      instanceId: 'instance_1',
      topics: [topic],
      autoOffsetReset: 'earliest',
    })

    return messages
  } catch (error) {
    throw error
  }
}

router.get('/consumer/:topic', async (request) => {
  try {
    const { topic, groupId } = request.params
    const messages = await consumeMessages(topic, groupId || request.ctx.user.id)

    return json(
      {
        api,
        topic,
        messages:
          messages && messages.length > 0
            ? messages.map((message) => ({
                message: message.value,
                offset: message.offset,
              }))
            : [],
        user: request.ctx.user,
      },
      { status: 200 }
    )
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

router.get('/fetch/:topic', async (request) => {
  try {
    const { topic } = request.params
    const consumer = new Kafka(request.kafkaConfig).consumer()

    const messages = await consumer.fetch({ topic, partition: 0, offset: 0 })

    return json(
      {
        api,
        topic,
        messages:
          messages && messages.length > 0
            ? messages.map((message) => ({
                message: message.value,
                offset: message.offset,
              }))
            : [],
        user: request.ctx.user,
      },
      { status: 200 }
    )
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

router.get('*', () => new Response('Not Found.', { status: 404 }))

export default {
	async fetch(request) {
    return router.all('*', withCtx).handle(request, env)
	},
}
