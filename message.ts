interface Message<Body = unknown> {
  readonly id: string
  readonly timestamp: Date
  readonly body: Body
  ack(): void
  retry(): void
}

export { Message }