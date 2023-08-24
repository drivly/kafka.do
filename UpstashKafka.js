export class UpstashKafka {
  constructor(baseUrl, username, password) {
    this.baseUrl = baseUrl
    this.auth = btoa(`${username}:${password}`)
  }

  async listQueues() {
    let data = await fetch(`https://${this.baseUrl}/topics`, {
      headers: { Authorization: 'Basic ' + this.auth },
    }).then((response) => response.json())

    data = await fetch(`https://${this.baseUrl}/offsets/latest`, {
      headers: { Authorization: 'Basic ' + this.auth },
      method: 'POST',
      body: JSON.stringify(Object.entries(data).flatMap(([topic, partitions]) => Array.from(Array(partitions).keys()).map((partition) => ({ topic, partition })))),
    }).then((response) => response.json())
    return data
  }

  async send(queue, message) {
    return await fetch(`https://${this.baseUrl}/produce/${queue}/${message}`, {
      headers: { Authorization: 'Basic ' + this.auth },
    }).then((response) => response.json())
  }

  async sendBatch(queue, messages) {
    return await fetch(`https://${this.baseUrl}/produce/${queue}`, {
      headers: { Authorization: 'Basic ' + this.auth },
      method: 'POST',
      body: JSON.stringify(messages.map((value) => ({ value }))),
    }).then((response) => response.json())
  }

  async queue(queue, group = 'GROUP_1', partition = '0') {
    return await fetch(`https://${this.baseUrl}/consume/${group}/${partition}/${queue}`, {
      headers: { Authorization: 'Basic ' + this.auth },
    }).then((response) => response.json())
  }

  async fetch(queue, partition, offset) {
    const response = await fetch(`https://${this.baseUrl}/fetch`, {
      headers: { Authorization: `Basic ${auth}` },
      method: 'POST',
      body: JSON.stringify({
        topic: queue,
        partition,
        offset,
      }),
    })
    return await response.json()
  }
}
