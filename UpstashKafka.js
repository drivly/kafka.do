export class UpstashKafka {
  #baseUrl
  #auth
  queueName
  group = 'GROUP_1'
  partition = 0
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

  async send(message, queue = this.queueName) {
    console.debug('send', queue, message)
    let val = message?.value || message?.[0]?.value ? message : Array.isArray(message) ? message.map((value) => ({ value })) : { value: message }
    return await this.kafkaService(`produce/${queue}`, val).then((response) => this.#formatResponse(response))
  }

  async sendBatch(messages, queue = this.queueName) {
    this.send(messages, queue)
  }

  async queue(queue = this.queueName, group = this.group, partition = this.partition) {
    return await this.kafkaService(`consume/${group}/${partition}/${queue}`).then((response) => this.#formatResponse(response))
  }

  async ack(offset, queue = this.queueName, group = this.group, partition = this.partition) {
    return await this.kafkaService(`commit/${group}/${partition}`, { topic: queue, partition, offset }).then((response) => this.#formatResponse(response))
  }

  async ackAll(group = this.group, partition = this.partition) {
    return await this.kafkaService(`commit/${group}/${partition}`).then((response) => this.#formatResponse(response))
  }

  async fetch(offset, queue = this.queueName, partition = this.partition) {
    return await this.kafkaService('fetch', {
      topic: queue,
      partition,
      offset,
    }).then((response) => this.#formatResponse(response))
  }

  async #formatResponse(value) {
    value = { queue: value.topic, ...value }
    delete value.topic
    return value
  }

  async kafkaService(url, body) {
    return await fetch(`https://${this.#baseUrl}/${url}`, {
      headers: { Authorization: 'Basic ' + this.#auth, 'Content-Type': body ? 'application/json' : undefined },
      method: body ? 'POST' : 'GET',
      body: !body || typeof body === 'string' ? body : JSON.stringify(body),
    }).then((response) => response.json())
  }
}
