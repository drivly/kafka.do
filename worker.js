import { Kafka } from '@upstash/kafka'
import { withDurables } from 'itty-durable'
import { Router, json, error, withParams } from 'itty-router'
import { SVIX } from 'svix'
import { TopicManager } from './TopicManager'

let kafkaConfig
let svixSecret

const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(request).then((res) => res.json())
  if (!kafkaConfig)
    kafkaConfig = {
      url: env.KAFKA_URL,
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
    }
  if (!svixSecret) svixSecret = env.SVIX_SECRET
  console.log(request)
  if (!request.ctx.user) {
    return Response.redirect('/login')
  }
  request.api = {
    icon: '▥',
    name: 'kafka.do',
    description: 'Cloudflare Worker API for Kafka with webhooks',
    url: 'https://kafka.do',
    endpoints: {
      listAll: request.ctx.origin + '/',
      consume: request.ctx.origin + '/:queue',
      produce: request.ctx.origin + '/:queue/send/:message',
      sendBatch: request.ctx.origin + '/:queue/sendBatch',
      acknowledgeAll: request.ctx.origin + '/:queue/ackAll',
      retryAll: request.ctx.origin + '/:queue/retryAll',
      acknowledge: request.ctx.origin + '/:queue/ack/:messageId',
      retry: request.ctx.origin + '/:queue/retry/:messageId',
      listWebhooks: request.ctx.origin + '/:queue/webhook',
      createWebhook: request.ctx.origin + '/:queue/webhook/:url',
    },
    memberOf: 'https://apis.do/pubsub',
    login: request.ctx.origin + '/login',
    logout: request.ctx.origin + '/logout',
    repo: 'https://github.com/drivly/kafka.do',
  }
}

const router = Router()
router.all('*', withCtx)
router.all('*', withParams)
router.all('*', withDurables())

router.get('/', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/send/:message', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.post('/:queue/sendBatch', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/ackAll', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/retryAll', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/ack/:messageId', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/retry/:messageId', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/webhook/:url', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue/webhook', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('*', (request) => error(404, { api: request.api, error: 'Not Found', user: request.ctx.user }))

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}
