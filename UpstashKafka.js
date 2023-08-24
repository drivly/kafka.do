export class UpstashKafka {
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

  async send(queue, message) {
    return await fetch(`https://${this.#baseUrl}/produce/${queue}/${message}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
    }).then((response) => this.#formatResponse(response))
  }

  async sendBatch(queue, messages) {
    return await fetch(`https://${this.#baseUrl}/produce/${queue}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
      method: 'POST',
      body: JSON.stringify(messages.map((value) => ({ value }))),
    }).then((response) => this.#formatResponse(response))
  }

  async queue(queue, group = 'GROUP_1', partition = '0') {
    return await fetch(`https://${this.#baseUrl}/consume/${group}/${partition}/${queue}`, {
      headers: { Authorization: 'Basic ' + this.#auth },
    }).then((response) => this.#formatResponse(response))
  }

  async fetch(queue, partition, offset) {
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
