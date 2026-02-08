import type PocketBase from 'pocketbase'
import type { RecordModel, FileOptions } from './types'

/**
 * Storage module — work with file fields on PocketBase records.
 *
 * PocketBase stores files as record fields. This module provides helpers
 * to get file URLs and generate access tokens for protected files.
 *
 * @example
 * ```ts
 * const user = await pb.collection('users').getOne('user_id')
 *
 * // Get the URL for the user's avatar
 * const avatarUrl = pb.storage.getFileUrl(user, 'avatar.jpg')
 *
 * // Get a thumbnail URL (100x100)
 * const thumbUrl = pb.storage.getFileUrl(user, 'avatar.jpg', {
 *   thumb: '100x100',
 * })
 *
 * // Get a temporary token for protected files
 * const token = await pb.storage.getFileToken()
 * const protectedUrl = pb.storage.getFileUrl(user, 'document.pdf', { token })
 * ```
 */
export class PicoBaseStorage {
  private pb: PocketBase

  constructor(pb: PocketBase) {
    this.pb = pb
  }

  /**
   * Get the public URL for a file attached to a record.
   *
   * @param record - The record that owns the file.
   * @param filename - The filename (as stored in the record's file field).
   * @param options - Optional: thumb size, token for protected files, download flag.
   */
  getFileUrl(record: RecordModel, filename: string, options: FileOptions = {}): string {
    const queryParams: Record<string, string> = {}

    if (options.thumb) {
      queryParams['thumb'] = options.thumb
    }
    if (options.token) {
      queryParams['token'] = options.token
    }
    if (options.download) {
      queryParams['download'] = '1'
    }

    return this.pb.files.getURL(record, filename, queryParams)
  }

  /**
   * Generate a temporary file access token.
   *
   * Use this for accessing protected files. Tokens are short-lived.
   */
  async getFileToken(): Promise<string> {
    return this.pb.files.getToken()
  }
}
