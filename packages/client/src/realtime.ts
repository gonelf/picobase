import type PocketBase from 'pocketbase'
import type { RecordModel, RecordSubscription } from './types'

/**
 * Realtime module — manage global realtime subscriptions.
 *
 * For collection-level subscriptions, prefer `pb.collection('name').subscribe()`.
 * This module is for lower-level control over the SSE connection.
 *
 * @example
 * ```ts
 * // Subscribe to all changes on a collection
 * const unsub = await pb.realtime.subscribe('posts', (e) => {
 *   console.log(e.action, e.record)
 * })
 *
 * // Unsubscribe
 * await unsub()
 *
 * // Disconnect all realtime connections
 * pb.realtime.disconnect()
 * ```
 */
export class PicoBaseRealtime {
  private pb: PocketBase

  constructor(pb: PocketBase) {
    this.pb = pb
  }

  /**
   * Subscribe to realtime events on a collection.
   *
   * @param collection - Collection name (e.g. 'posts').
   * @param callback - Called on every create/update/delete event.
   * @returns Unsubscribe function.
   */
  async subscribe<T = RecordModel>(
    collection: string,
    callback: (data: RecordSubscription<T>) => void,
  ): Promise<() => Promise<void>> {
    await this.pb.collection(collection).subscribe<T>('*', callback)
    return () => this.pb.collection(collection).unsubscribe('*')
  }

  /**
   * Subscribe to realtime events on a specific record.
   *
   * @param collection - Collection name.
   * @param recordId - Record ID.
   * @param callback - Called on update/delete events.
   * @returns Unsubscribe function.
   */
  async subscribeRecord<T = RecordModel>(
    collection: string,
    recordId: string,
    callback: (data: RecordSubscription<T>) => void,
  ): Promise<() => Promise<void>> {
    await this.pb.collection(collection).subscribe<T>(recordId, callback)
    return () => this.pb.collection(collection).unsubscribe(recordId)
  }

  /**
   * Unsubscribe from all realtime events on a collection.
   */
  async unsubscribe(collection: string): Promise<void> {
    await this.pb.collection(collection).unsubscribe()
  }

  /**
   * Unsubscribe from ALL realtime events. The SSE connection will be
   * automatically closed when there are no remaining subscriptions.
   */
  async disconnectAll(): Promise<void> {
    await this.pb.realtime.unsubscribe()
  }
}
