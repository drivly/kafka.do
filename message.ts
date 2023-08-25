export type QueuesContentType = 'text' | 'bytes' | 'json' | 'v8'

export interface Message<Body = unknown> {
  readonly id: string
  readonly timestamp: Date
  readonly body: Body
  ack(): void
  retry(): void
}

export interface MessageBatch<Body = unknown> {
  readonly queue: string
  readonly messages: Message<Body>[]
  ackAll(): void
  retryAll(): void
}

export interface MessageSendRequest {
  body: QueuesContentType
}
