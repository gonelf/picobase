import type PocketBase from 'pocketbase'
import type { RecordModel, ListResult } from 'pocketbase'

/** Options for list queries. */
export interface ListOptions {
  sort?: string
  filter?: string
  expand?: string
  fields?: string
  skipTotal?: boolean
  [key: string]: unknown
}

/** Options for single record queries. */
export interface RecordQueryOptions {
  expand?: string
  fields?: string
  [key: string]: unknown
}

/**
 * Collection module — CRUD operations on a PocketBase collection.
 *
 * @example
 * ```ts
 * const posts = pb.collection('posts')
 *
 * // List with filtering, sorting, and pagination
 * const result = await posts.getList(1, 20, {
 *   filter: 'published = true',
 *   sort: '-created',
 *   expand: 'author',
 * })
 *
 * // Get a single record
 * const post = await posts.getOne('record_id')
 *
 * // Create a record
 * const newPost = await posts.create({
 *   title: 'Hello World',
 *   content: 'My first post',
 * })
 *
 * // Update a record
 * const updated = await posts.update('record_id', { title: 'Updated' })
 *
 * // Delete a record
 * await posts.delete('record_id')
 * ```
 */
export class PicoBaseCollection<T = RecordModel> {
  private pb: PocketBase
  private name: string

  constructor(pb: PocketBase, name: string) {
    this.pb = pb
    this.name = name
  }

  /**
   * Fetch a paginated list of records.
   *
   * @param page - Page number (1-indexed). Default: 1.
   * @param perPage - Records per page. Default: 30.
   * @param options - Filter, sort, expand, fields.
   */
  async getList(page = 1, perPage = 30, options: ListOptions = {}): Promise<ListResult<T>> {
    return this.pb.collection(this.name).getList<T>(page, perPage, options)
  }

  /**
   * Fetch all records matching the filter (auto-paginates).
   *
   * **Warning:** Use with caution on large collections. Prefer `getList()` with pagination.
   */
  async getFullList(options: ListOptions = {}): Promise<T[]> {
    return this.pb.collection(this.name).getFullList<T>(options)
  }

  /**
   * Fetch a single record by ID.
   */
  async getOne(id: string, options: RecordQueryOptions = {}): Promise<T> {
    return this.pb.collection(this.name).getOne<T>(id, options)
  }

  /**
   * Fetch the first record matching a filter.
   *
   * @example
   * ```ts
   * const admin = await pb.collection('users').getFirstListItem('role = "admin"')
   * ```
   */
  async getFirstListItem(filter: string, options: RecordQueryOptions = {}): Promise<T> {
    return this.pb.collection(this.name).getFirstListItem<T>(filter, options)
  }

  /**
   * Create a new record.
   *
   * @param data - Record data. Can be a plain object or `FormData` (for file uploads).
   */
  async create(data: Record<string, unknown> | FormData, options: RecordQueryOptions = {}): Promise<T> {
    return this.pb.collection(this.name).create<T>(data, options)
  }

  /**
   * Update an existing record.
   *
   * @param id - Record ID.
   * @param data - Fields to update. Can be a plain object or `FormData`.
   */
  async update(id: string, data: Record<string, unknown> | FormData, options: RecordQueryOptions = {}): Promise<T> {
    return this.pb.collection(this.name).update<T>(id, data, options)
  }

  /**
   * Delete a record by ID.
   */
  async delete(id: string): Promise<boolean> {
    return this.pb.collection(this.name).delete(id)
  }

  /**
   * Subscribe to realtime changes on this collection.
   *
   * @param callback - Called on every create/update/delete event.
   * @param filter - Optional: only receive events matching this filter.
   * @returns Unsubscribe function.
   *
   * @example
   * ```ts
   * const unsubscribe = await pb.collection('posts').subscribe((e) => {
   *   console.log(e.action, e.record)
   * })
   *
   * // Later:
   * await unsubscribe()
   * ```
   */
  async subscribe(
    callback: (data: { action: string; record: T }) => void,
    filter?: string,
  ): Promise<() => Promise<void>> {
    const topic = '*'
    await this.pb.collection(this.name).subscribe<T>(topic, callback, filter ? { filter } : undefined)
    return () => this.pb.collection(this.name).unsubscribe(topic)
  }

  /**
   * Subscribe to changes on a specific record.
   *
   * @param id - Record ID.
   * @param callback - Called on update/delete events.
   * @returns Unsubscribe function.
   */
  async subscribeOne(
    id: string,
    callback: (data: { action: string; record: T }) => void,
  ): Promise<() => Promise<void>> {
    await this.pb.collection(this.name).subscribe<T>(id, callback)
    return () => this.pb.collection(this.name).unsubscribe(id)
  }
}
