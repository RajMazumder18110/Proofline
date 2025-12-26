/** @notice Library imports */
import IORedis from "ioredis";
import { QueueEventsProducer } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import type { OrderEventPublishPayload } from "@/types/order";

export class OrderEventQueue {
  /// Holds the instances.
  private _pub: QueueEventsProducer;

  /**
   * @notice Constructor
   * @dev Initializes the Order event queue.
   * @param connection The Redis connection instance.
   */
  constructor(connection: IORedis) {
    this._pub = new QueueEventsProducer(Queues.ORDER_EVENTS_QUEUE, {
      connection,
    });
  }

  /// Public methods ///
  /**
   * @notice Publishes an event to the order events queue.
   * @dev Publishes the given payload to the queue.
   * @param payload The event payload to publish.
   */
  public async publish(payload: OrderEventPublishPayload): Promise<void> {
    await this._pub.publishEvent(payload);
  }
}
