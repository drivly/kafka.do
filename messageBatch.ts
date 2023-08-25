import { Message } from './message'
interface MessageBatch<Body = unknown> {
  readonly queue: string
  readonly messages: Message<Body>[]
  ackAll(): void
  retryAll(): void
}
export { MessageBatch }
