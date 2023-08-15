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
    await producer.connect()
    const { baseOffset } = await producer.send({
      topic,
      messages: [{ value: message }],
    })
    await producer.disconnect()

    return json({ api: request.api, topic, message, offset: baseOffset, user: request.ctx.user }, { status: 200 })
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

async function consumeSingleMessage(topic, groupId) {
  const kafka = new Kafka(request.kafkaConfig)
  const consumer = kafka.consumer({ groupId })

  try {
    await consumer.subscribe({ topic })
    const messages = await consumer.runOnce({ autoCommit: true, eachMessage: true })

    if (messages && messages.length > 0) {
      return messages[0]
    } else {
      return null
    }
  } catch (error) {
    throw error
  }
}

router.get('/consumer/:topic', async (request) => {
  try {
    const { topic } = request.params
    const message = await consumeSingleMessage(topic, groupId)

    if (message) {
      return json({ api: request.api, topic, message: message.value, offset: message.offset, user: request.ctx.user }, { status: 200 })
    } else {
      return json({ api: request.api, error: 'No messages available', user: request.ctx.user }, { status: 404 })
    }
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

async function consumeMultipleMessages(topic, groupId, count) {
  const kafka = new Kafka(request.kafkaConfig)
  const consumer = kafka.consumer({ groupId })
  try {
    await consumer.subscribe({ topic })
    const messages = await consumer.runOnce({
      autoCommit: true,
      maxMessages: count,
      eachMessage: true,
    })
    return messages
  } catch (error) {
    throw error
  }
}

router.get('/consumer/:topic/:count', async (request) => {
  try {
    const { topic, count } = request.params
    const messages = await consumeMultipleMessages(topic, groupId, parseInt(count))

    if (messages && messages.length > 0) {
      return new Response(
        JSON.stringify({
          api,
          topic,
          messages: messages.map((message) => ({
            message: message.value,
            offset: message.offset,
          })),
          user: request.ctx.user,
        }),
        { status: 200 }
      )
    } else {
      return json({ api: request.api, error: 'No messages available', user: request.ctx.user }, { status: 404 })
    }
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

router.get('/fetch/:topic', async (request, { topic }) => {
  try {
    const message = await consumeSingleMessage(topic, groupId + '-fetch')

    if (message) {
      return json({ api: request.api, topic, message: message.value, offset: message.offset, user: request.ctx.user }, { status: 200 })
    } else {
      return json({ api: request.api, error: 'No messages available', user: request.ctx.user }, { status: 404 })
    }
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

router.get('/fetch/:topic/:count', async (request) => {
  try {
    const { topic, count } = request.params
    const messages = await consumeMultipleMessages(topic, groupId + '-fetch', parseInt(count))

    if (messages && messages.length > 0) {
      return new Response(
        JSON.stringify({
          api,
          topic,
          messages: messages.map((message) => ({
            message: message.value,
            offset: message.offset,
          })),
          user: request.ctx.user,
        }),
        { status: 200 }
      )
    } else {
      return json({ api: request.api, error: 'No messages available', user: request.ctx.user }, { status: 404 })
    }
  } catch (error) {
    return json({ api: request.api, error: error.message, user: request.ctx.user }, { status: 500 })
  }
})

addEventListener('fetch', (event) => {
  event.respondWith(router.all('*', withCtx).handle(event.request, event.env))
})
