import { CommandEnvelopeSchema } from "beast-contracts/core";
import { publishEvent } from "../data/EventPublisher";

export class CommandRouter {
  constructor(handlers) {
    this.handlers = handlers; // { domain, orchestration, system }
  }

  route(commandEnvelope) {
    const valid = CommandEnvelopeSchema.safeParse(commandEnvelope);
    if (!valid.success) throw new Error("Invalid command envelope");

    const { commandType } = valid.data;

    const handler = this.handlers[commandType];
    if (!handler) {
      const errorPacket = {
        id: crypto.randomUUID(),
        envelope: commandEnvelope,
        reason: `No handler for command type: ${commandType}`,
        rejectedAt: new Date().toISOString()
      };

      publishEvent("core.command.unroutable", errorPacket);
      throw new Error(`Unroutable command type: ${commandType}`);
    }

    const routedPacket = {
      id: crypto.randomUUID(),
      commandType,
      envelope: valid.data,
      routedAt: new Date().toISOString()
    };

    publishEvent("core.command.routed", routedPacket);

    return handler(valid.data);
  }
}
