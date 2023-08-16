import { createDurable } from 'itty-durable'

export class TopicManager extends createDurable({ autoReturn: true, autoPersist: true }) {
  constructor(state, env) {
    super(state, env)
    this.topics = []
  }

  listTopics() {
    return this.topics.map(({ name }) => name)
  }

  addTopic(name) {
    this.topics.push({ name })
  }

  addWebhook(topic, url) {
    const topicIndex = this.topics.findIndex(({ name }) => name === topic)
    if (topicIndex === -1) {
      this.topics.push({ name: topic })
    }
    const topicObj = this.topics[topicIndex]
    if (!topicObj.webhooks) {
      topicObj.webhooks = []
    }
    topicObj.webhooks.push(url)
  }

  removeWebhook(topic, url) {
    const topicIndex = this.topics.findIndex(({ name }) => name === topic)
    if (topicIndex === -1) return
    const topicObj = this.topics[topicIndex]
    if (!topicObj.webhooks) return
    const urlIndex = topicObj.webhooks.findIndex((u) => u === url)
    if (urlIndex === -1) return
    topicObj.webhooks.splice(urlIndex, 1)
  }
}
