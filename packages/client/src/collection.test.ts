import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PicoBaseCollection } from './collection'
import type PocketBase from 'pocketbase'

// Mock PocketBase
const createMockPocketBase = () => {
  const mockCollection = {
    getList: vi.fn(),
    getFullList: vi.fn(),
    getOne: vi.fn(),
    getFirstListItem: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
  }

  return {
    collection: vi.fn(() => mockCollection),
    _mockCollection: mockCollection,
  } as unknown as PocketBase & { _mockCollection: typeof mockCollection }
}

describe('PicoBaseCollection', () => {
  let pb: PocketBase & { _mockCollection: any }
  let collection: PicoBaseCollection

  beforeEach(() => {
    pb = createMockPocketBase()
    collection = new PicoBaseCollection(pb, 'posts')
  })

  describe('getList', () => {
    it('should call pb.collection().getList() with defaults', async () => {
      const mockResult = {
        page: 1,
        perPage: 30,
        totalItems: 100,
        totalPages: 4,
        items: [{ id: '1', title: 'Post 1' }],
      }
      pb._mockCollection.getList.mockResolvedValue(mockResult)

      const result = await collection.getList()

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.getList).toHaveBeenCalledWith(1, 30, {})
      expect(result).toEqual(mockResult)
    })

    it('should pass page and perPage arguments', async () => {
      const mockResult = { page: 2, perPage: 50, items: [] }
      pb._mockCollection.getList.mockResolvedValue(mockResult)

      await collection.getList(2, 50)

      expect(pb._mockCollection.getList).toHaveBeenCalledWith(2, 50, {})
    })

    it('should pass options (filter, sort, expand)', async () => {
      const mockResult = { items: [] }
      pb._mockCollection.getList.mockResolvedValue(mockResult)

      await collection.getList(1, 20, {
        filter: 'published = true',
        sort: '-created',
        expand: 'author',
      })

      expect(pb._mockCollection.getList).toHaveBeenCalledWith(1, 20, {
        filter: 'published = true',
        sort: '-created',
        expand: 'author',
      })
    })

    it('should pass skipTotal option', async () => {
      const mockResult = { items: [] }
      pb._mockCollection.getList.mockResolvedValue(mockResult)

      await collection.getList(1, 30, { skipTotal: true })

      expect(pb._mockCollection.getList).toHaveBeenCalledWith(1, 30, { skipTotal: true })
    })
  })

  describe('getFullList', () => {
    it('should call pb.collection().getFullList() with defaults', async () => {
      const mockResult = [{ id: '1', title: 'Post 1' }, { id: '2', title: 'Post 2' }]
      pb._mockCollection.getFullList.mockResolvedValue(mockResult)

      const result = await collection.getFullList()

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.getFullList).toHaveBeenCalledWith({})
      expect(result).toEqual(mockResult)
    })

    it('should pass options', async () => {
      const mockResult = [{ id: '1' }]
      pb._mockCollection.getFullList.mockResolvedValue(mockResult)

      await collection.getFullList({ filter: 'status = "active"', sort: 'name' })

      expect(pb._mockCollection.getFullList).toHaveBeenCalledWith({
        filter: 'status = "active"',
        sort: 'name',
      })
    })
  })

  describe('getOne', () => {
    it('should call pb.collection().getOne() with record ID', async () => {
      const mockRecord = { id: 'abc123', title: 'My Post' }
      pb._mockCollection.getOne.mockResolvedValue(mockRecord)

      const result = await collection.getOne('abc123')

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.getOne).toHaveBeenCalledWith('abc123', {})
      expect(result).toEqual(mockRecord)
    })

    it('should pass options (expand, fields)', async () => {
      const mockRecord = { id: 'abc123' }
      pb._mockCollection.getOne.mockResolvedValue(mockRecord)

      await collection.getOne('abc123', { expand: 'author', fields: 'id,title' })

      expect(pb._mockCollection.getOne).toHaveBeenCalledWith('abc123', {
        expand: 'author',
        fields: 'id,title',
      })
    })
  })

  describe('getFirstListItem', () => {
    it('should call pb.collection().getFirstListItem() with filter', async () => {
      const mockRecord = { id: '1', role: 'admin' }
      pb._mockCollection.getFirstListItem.mockResolvedValue(mockRecord)

      const result = await collection.getFirstListItem('role = "admin"')

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.getFirstListItem).toHaveBeenCalledWith('role = "admin"', {})
      expect(result).toEqual(mockRecord)
    })

    it('should pass options', async () => {
      const mockRecord = { id: '1' }
      pb._mockCollection.getFirstListItem.mockResolvedValue(mockRecord)

      await collection.getFirstListItem('status = "active"', { expand: 'author' })

      expect(pb._mockCollection.getFirstListItem).toHaveBeenCalledWith('status = "active"', {
        expand: 'author',
      })
    })
  })

  describe('create', () => {
    it('should call pb.collection().create() with data object', async () => {
      const data = { title: 'New Post', content: 'Hello' }
      const mockRecord = { id: 'new123', ...data }
      pb._mockCollection.create.mockResolvedValue(mockRecord)

      const result = await collection.create(data)

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.create).toHaveBeenCalledWith(data, {})
      expect(result).toEqual(mockRecord)
    })

    it('should accept FormData for file uploads', async () => {
      const formData = new FormData()
      formData.append('title', 'Post with image')
      formData.append('image', new Blob(['image data']))

      const mockRecord = { id: 'new123', title: 'Post with image' }
      pb._mockCollection.create.mockResolvedValue(mockRecord)

      const result = await collection.create(formData)

      expect(pb._mockCollection.create).toHaveBeenCalledWith(formData, {})
      expect(result).toEqual(mockRecord)
    })

    it('should pass options', async () => {
      const data = { title: 'New Post' }
      const mockRecord = { id: 'new123', title: 'New Post' }
      pb._mockCollection.create.mockResolvedValue(mockRecord)

      await collection.create(data, { expand: 'author' })

      expect(pb._mockCollection.create).toHaveBeenCalledWith(data, { expand: 'author' })
    })
  })

  describe('update', () => {
    it('should call pb.collection().update() with ID and data', async () => {
      const data = { title: 'Updated Title' }
      const mockRecord = { id: 'abc123', title: 'Updated Title' }
      pb._mockCollection.update.mockResolvedValue(mockRecord)

      const result = await collection.update('abc123', data)

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.update).toHaveBeenCalledWith('abc123', data, {})
      expect(result).toEqual(mockRecord)
    })

    it('should accept FormData', async () => {
      const formData = new FormData()
      formData.append('title', 'Updated via FormData')

      const mockRecord = { id: 'abc123', title: 'Updated via FormData' }
      pb._mockCollection.update.mockResolvedValue(mockRecord)

      const result = await collection.update('abc123', formData)

      expect(pb._mockCollection.update).toHaveBeenCalledWith('abc123', formData, {})
      expect(result).toEqual(mockRecord)
    })

    it('should pass options', async () => {
      const data = { status: 'published' }
      const mockRecord = { id: 'abc123', status: 'published' }
      pb._mockCollection.update.mockResolvedValue(mockRecord)

      await collection.update('abc123', data, { expand: 'author' })

      expect(pb._mockCollection.update).toHaveBeenCalledWith('abc123', data, { expand: 'author' })
    })
  })

  describe('delete', () => {
    it('should call pb.collection().delete() with record ID', async () => {
      pb._mockCollection.delete.mockResolvedValue(true)

      const result = await collection.delete('abc123')

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.delete).toHaveBeenCalledWith('abc123')
      expect(result).toBe(true)
    })

    it('should return false if delete fails', async () => {
      pb._mockCollection.delete.mockResolvedValue(false)

      const result = await collection.delete('nonexistent')

      expect(result).toBe(false)
    })
  })

  describe('subscribe', () => {
    it('should subscribe to all events on the collection', async () => {
      const callback = vi.fn()
      pb._mockCollection.subscribe.mockResolvedValue(undefined)

      const unsubscribe = await collection.subscribe(callback)

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.subscribe).toHaveBeenCalledWith('*', callback, undefined)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should pass filter option when provided', async () => {
      const callback = vi.fn()
      pb._mockCollection.subscribe.mockResolvedValue(undefined)

      await collection.subscribe(callback, 'published = true')

      expect(pb._mockCollection.subscribe).toHaveBeenCalledWith('*', callback, {
        filter: 'published = true',
      })
    })

    it('should return unsubscribe function that calls pb.unsubscribe', async () => {
      const callback = vi.fn()
      pb._mockCollection.subscribe.mockResolvedValue(undefined)
      pb._mockCollection.unsubscribe.mockResolvedValue(undefined)

      const unsubscribe = await collection.subscribe(callback)
      await unsubscribe()

      expect(pb._mockCollection.unsubscribe).toHaveBeenCalledWith('*')
    })

    it('should invoke callback on realtime events', async () => {
      const callback = vi.fn()
      let realtimeCallback: any

      pb._mockCollection.subscribe.mockImplementation((_topic, cb) => {
        realtimeCallback = cb
        return Promise.resolve()
      })

      await collection.subscribe(callback)

      // Simulate a realtime event
      const event = { action: 'create', record: { id: '123', title: 'New Post' } }
      realtimeCallback(event)

      expect(callback).toHaveBeenCalledWith(event)
    })
  })

  describe('subscribeOne', () => {
    it('should subscribe to events for a specific record', async () => {
      const callback = vi.fn()
      pb._mockCollection.subscribe.mockResolvedValue(undefined)

      const unsubscribe = await collection.subscribeOne('abc123', callback)

      expect(pb.collection).toHaveBeenCalledWith('posts')
      expect(pb._mockCollection.subscribe).toHaveBeenCalledWith('abc123', callback)
      expect(typeof unsubscribe).toBe('function')
    })

    it('should return unsubscribe function for specific record', async () => {
      const callback = vi.fn()
      pb._mockCollection.subscribe.mockResolvedValue(undefined)
      pb._mockCollection.unsubscribe.mockResolvedValue(undefined)

      const unsubscribe = await collection.subscribeOne('abc123', callback)
      await unsubscribe()

      expect(pb._mockCollection.unsubscribe).toHaveBeenCalledWith('abc123')
    })

    it('should invoke callback on record-specific events', async () => {
      const callback = vi.fn()
      let realtimeCallback: any

      pb._mockCollection.subscribe.mockImplementation((_id, cb) => {
        realtimeCallback = cb
        return Promise.resolve()
      })

      await collection.subscribeOne('abc123', callback)

      // Simulate a realtime event for this specific record
      const event = { action: 'update', record: { id: 'abc123', title: 'Updated' } }
      realtimeCallback(event)

      expect(callback).toHaveBeenCalledWith(event)
    })
  })
})
