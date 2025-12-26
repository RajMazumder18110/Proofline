/** @notice Library imports */
import IORedis from "ioredis";
import { QueueEventsProducer, QueueEvents } from "bullmq";
/// Local imports
import { Queues } from "@/queues";
import type { OrderEventPublishPayload } from "@/types/order";
import { logger } from "@/configs/logger";

export class OrderEventQueue {
  /// Holds the instances.
  private _sub: QueueEvents;
  private _pub: QueueEventsProducer;

  /**
   * @notice Constructor
   * @dev Initializes the Order event queue.
   * @param connection The Redis connection instance.
   */
  constructor(connection: IORedis) {
    this._sub = new QueueEvents(Queues.ORDER_EVENTS_QUEUE, {
      connection,
      // autorun: false,
    });
    this._pub = new QueueEventsProducer(Queues.ORDER_EVENTS_QUEUE, {
      connection,
    });
  }

  /// Public methods ///
  /**
   * @notice Binds event listeners to the Order event queue.
   * @return The event listener binding method.
   */
  public get on() {
    return this._sub.on.bind(this._sub);
  }

  /**
   * @notice Gets the QueueEvents instance.
   * @return The QueueEvents instance.
   */
  public get events(): QueueEvents {
    return this._sub;
  }

  /**
   * @notice Starts the Order event queue.
   * @dev Begins processing events from the queue.
   */
  public async start(): Promise<void> {
    await this._sub.run();
  }

  /**
   * @notice Stops the Order event queue.
   * @dev Cleans up the queue and stops processing events.
   */
  public async stop(): Promise<void> {
    await this._sub.close();
  }

  /**
   * @notice Publishes an event to the order events queue.
   * @dev Publishes the given payload to the queue.
   * @param payload The event payload to publish.
   */
  public async publish(payload: OrderEventPublishPayload): Promise<void> {
    await this._pub.publishEvent(payload);
  }
}
