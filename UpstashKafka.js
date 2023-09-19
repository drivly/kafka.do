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
    const data = await fetch(`https://${this.#baseUrl}/topics`, {
      headers: { Authorization: 'Basic ' + this.#auth },
    }).then((response) => response.json())

    return await fetch(`https://${this.#baseUrl}/offsets/latest`, {
      headers: { Authorization: 'Basic ' + this.#auth },
      method: 'POST',
      body: JSON.stringify(Object.entries(data).flatMap(([topic, partitions]) => Array.from(Array(partitions).keys()).map((partition) => ({ topic, partition })))),
    })
      .then((response) => response.json())
      .then((t) => t.map(({ topic, partition, offset }) => ({ queue: topic, partition, offset })))
  }

  async send(message, queue = this.queueName) {
    return await fetch(`https://${this.#baseUrl}/produce/${queue}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
      method: 'POST',
      body: JSON.stringify(message.value || message[0]?.value ? message : Array.isArray(message) ? message.map((value) => ({ value })) : { value: message }),
    }).then((response) => this.#formatResponse(response))
  }

  async sendBatch(messages, queue = this.queueName) {
    this.send(messages, queue)
  }

  async queue(queue = this.queueName, group = this.group, partition = this.partition) {
    return await fetch(`https://${this.#baseUrl}/consume/${group}/${partition}/${queue}`, {
      headers: { Authorization: 'Basic ' + this.#auth, 'Kafka-Enable-Auto-Commit': false },
    }).then((response) => this.#formatResponse(response))
  }

  async ack(offset, queue = this.queueName, group = this.group, partition = this.partition) {
    return await fetch(`https://${this.#baseUrl}/commit/${group}/${partition}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
      method: 'POST',
      body: JSON.stringify({ topic: queue, partition, offset }),
    }).then((response) => this.#formatResponse(response))
  }

  async ackAll(group = this.group, partition = this.partition) {
    return await fetch(`https://${this.#baseUrl}/commit/${group}/${partition}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
    }).then((response) => this.#formatResponse(response))
  }

  async fetch(offset, queue = this.queueName, partition = this.partition) {
    return await fetch(`https://${this.#baseUrl}/fetch`, {
      headers: { Authorization: `Basic ${auth}` },
      method: 'POST',
      body: JSON.stringify({
        topic: queue,
        partition,
        offset,
      }),
    }).then((response) => this.#formatResponse(response))
  }

  async #formatResponse(response) {
    let value = await response.json()
    value = { queue: value.topic, ...value }
    delete value.topic
    return value
  }
}
