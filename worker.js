import { Kafka } from '@upstash/kafka'
import { Router, error, json, withParams } from 'itty-router'

let kafka

const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(request).then((res) => res.json())
  if (!kafka)
    kafka = new Kafka({
      url: env.KAFKA_URL,
      username: env.KAFKA_USERNAME,
      password: env.KAFKA_PASSWORD,
    })
  if (!request.ctx.user) {
    return Response.redirect('/login')
  }
  request.api = {
    icon: '▥',
    name: 'kafka.do',
    description: 'Cloudflare Worker API for Kafka with webhooks',
    url: 'https://kafka.do',
    endpoints: {
      listQueues: request.ctx.origin + '/',
      consume: request.ctx.origin + '/:queue',
      produce: request.ctx.origin + '/:queue/send/:message',
      sendBatch: request.ctx.origin + '/:queue/sendBatch',
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

router.get('/', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('/:queue', async (request) => {
  const { queue } = request.params
  const c = kafka.consumer()
  const data = await c.consume({
    consumerGroupId: 'group_1',
    instanceId: 'instance_1',
    topics: [queue],
    autoOffsetReset: 'earliest',
  })

  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/send/:message', async (request) => {
  const p = kafka.producer()
  const { queue, message } = request.params
  const data = await p.produce(queue, message)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.post('/:queue/sendBatch', async (request) => {
  const { queue } = request.params
  const messages = await request.json()
  const p = kafka.producer()
  const options = undefined
  const data = await p.produceMany(messages.map((value) => ({ topic: queue, value, options })))
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/retry/:messageId', async (request) => {
  return json({ api: request.api, user: request.ctx.user })
})

router.get('*', (request) => error(404, { api: request.api, error: 'Not Found', user: request.ctx.user }))

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}
