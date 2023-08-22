import { Router, error, json, withParams } from 'itty-router'

const withCtx = async (request, env) => {
  request.ctx = await env.CTX.fetch(request).then((res) => res.json())
  request.env = env
  if (!request.ctx.user) {
    return Response.redirect('/login')
  }
  if (!['admin', 'worker'].includes(request.ctx.user.role)) {
    return error(403, { api: request.api, error: 'Forbidden', user: request.ctx.user })
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
  request.auth = btoa(`${env.UPSTASH_KAFKA_USERNAME}:${env.UPSTASH_KAFKA_PASSWORD}`)
}

const router = Router()
router.all('*', withCtx)
router.all('*', withParams)

router.get('/api', async (request) => {
  let data = await fetch(`https://${request.env.UPSTASH_KAFKA_SERVER}/topics`, {
    headers: {
      Authorization: 'Basic ' + request.auth,
    },
  }).then((response) => response.json())

  data = await fetch(`https://${request.env.UPSTASH_KAFKA_SERVER}/offsets/latest`, {
    headers: {
      Authorization: 'Basic ' + request.auth,
    },
    method: 'POST',
    body: JSON.stringify(Object.entries(data).flatMap(([topic, partitions]) => Array.from(Array(partitions).keys()).map((partition) => ({ topic, partition })))),
  }).then((response) => response.json())
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/send/:message', async (request) => {
  const { queue, message } = request.params
  let data = await fetch(`https://${request.env.UPSTASH_KAFKA_SERVER}/produce/${queue}/${message}`, {
    headers: {
      Authorization: 'Basic ' + request.auth,
    },
  }).then((response) => response.json())

  return json({ api: request.api, data, user: request.ctx.user })
})

router.post('/:queue/sendBatch', async (request) => {
  const { queue } = request.params
  const messages = await request.json()
  let data = await fetch(`https://${request.env.UPSTASH_KAFKA_SERVER}/produce/${queue}`, {
    headers: {
      Authorization: 'Basic ' + request.auth,
    },
    method: 'POST',
    body: JSON.stringify(messages.map((value) => ({ value }))),
  }).then((response) => response.json())

  return json({ api: request.api, data, user: request.ctx.user })
})

async function queue(baseUrl, auth, queue, partition, instance) {
  return await fetch(`https://${baseUrl}/consume/${partition}/${instance}/${queue}`, {
    headers: {
      Authorization: 'Basic ' + auth,
    },
  }).then((response) => response.json())
}

router.get('/:queue', async (request) => {
  const { queue: topic } = request.params
  let data = await queue(request.env.UPSTASH_KAFKA_SERVER, request.auth, topic, 'GROUP_1', 'INSTANCE_1')
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/:partition', async (request) => {
  const { queue: topic, partition } = request.params
  let data = await queue(request.env.UPSTASH_KAFKA_SERVER, request.auth, topic, partition, 'INSTANCE_1')
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('/:queue/:partition/:instance', async (request) => {
  const { queue: topic, partition, instance } = request.params
  let data = await queue(request.env.UPSTASH_KAFKA_SERVER, request.auth, topic, partition, instance)
  return json({ api: request.api, data, user: request.ctx.user })
})

router.get('*', (request) => error(404, { api: request.api, error: 'Not Found', user: request.ctx.user }))

export default {
  fetch(request, env) {
    return router.handle(request, env)
  },
}
