class UpstashKafka {
  #baseUrl
  #auth
  constructor(baseUrl, username, password) {
    this.#baseUrl = baseUrl
    this.#auth = btoa(`${username}:${password}`)
  }

  async listQueues() {
    const data = await this.kafkaService('topics')
    return await this.kafkaService(
      'offsets/latest',
      Object.entries(data).flatMap(([topic, partitions]) => Array.from(Array(partitions).keys()).map((partition) => ({ topic, partition })))
    ).then((t) => t.map(({ topic, partition, offset }) => ({ queue: topic, partition, offset })))
  }

  async kafkaService(url, body) {
    console.debug('kafka', url, JSON.stringify(body))
    return await fetch(`https://${this.#baseUrl}/${url}`, {
      headers: { Authorization: 'Basic ' + this.#auth, 'Content-Type': body ? 'application/json' : undefined },
      method: body ? 'POST' : 'GET',
      body: !body || typeof body === 'string' ? body : JSON.stringify(body),
    }).then((response) => response.json())
  }
}

function formatResponse(value) {
  value = { queue: value.topic, ...value }
  delete value.topic
  return value
}

export class KafkaConsumer extends UpstashKafka {
  queueName
  group
  instance
  partition
  constructor(baseUrl, username, password, queueName, group = 'GROUP_1', instance = 0) {
    super(baseUrl, username, password)
    this.queueName = queueName
    this.group = group
    this.instance = instance
  }

  async queue(queue = this.queueName, group = this.group, instance = this.instance) {
    const messages = await this.kafkaService(`consume/${group}/${instance}/${queue}`).then((response) => formatResponse(response))
    if (!this.partition) this.partition = messages?.[0]?.partition
    return messages
  }

  async ack(offset, queue = this.queueName, group = this.group, instance = this.instance) {
    return await this.kafkaService(`commit/${group}/${instance}`, { topic: queue, partition: this.partition, offset }).then((response) => formatResponse(response))
  }

  async ackAll(group = this.group, instance = this.instance) {
    return await this.kafkaService(`commit/${group}/${instance}`).then((response) => formatResponse(response))
  }

  async fetch(offset, queue = this.queueName, partition = this.partition) {
    return await this.kafkaService('fetch', {
      topic: queue,
      partition,
      offset,
    }).then((response) => formatResponse(response))
  }
}

export class KafkaProducer extends UpstashKafka {
  queueName
  constructor(baseUrl, username, password, queueName) {
    super(baseUrl, username, password)
    this.queueName = queueName
  }

  async send(message, queue = this.queueName) {
    let val = message?.value || message?.[0]?.value ? message : Array.isArray(message) ? message.map((value) => ({ value })) : { value: message }
    return await this.kafkaService(`produce/${queue}`, val).then((response) => formatResponse(response))
  }

  async sendBatch(messages, queue = this.queueName) {
    this.send(messages, queue)
  }
}
