import { describe, it, expect } from 'vitest'
import { BufferReader } from '../src/io'

describe('BufferReader', () => {
    it('should read unsigned 8-bit integers', () => {
        const buffer = Buffer.from([0x12, 0x34])
        const reader = new BufferReader(buffer)
        expect(reader.readUInt8()).toBe(0x12)
        expect(reader.readUInt8()).toBe(0x34)
        expect(reader.hasMore()).toBe(false)
    })

    it('should read unsigned 16-bit big-endian integers', () => {
        const buffer = Buffer.from([0x12, 0x34, 0x56, 0x78])
        const reader = new BufferReader(buffer)
        expect(reader.readUInt16BE()).toBe(0x1234)
        expect(reader.readUInt16BE()).toBe(0x5678)
        expect(reader.hasMore()).toBe(false)
    })

    it('should read strings', () => {
        const buffer = Buffer.from('hello world', 'ascii')
        const reader = new BufferReader(buffer)
        expect(reader.readString(5, 'ascii')).toBe('hello')
        expect(reader.readString(6, 'ascii')).toBe(' world')
        expect(reader.hasMore()).toBe(false)
    })

    it('should read multi-byte unicode characters', () => {
        const buffer = Buffer.from('a\u{1F600}c') // 'a', grinning face, 'c'
        const reader = new BufferReader(buffer)
        expect(reader.readUnicodeChar()).toBe('a')
        expect(reader.readUnicodeChar()).toBe('\u{1F600}')
        expect(reader.readUnicodeChar()).toBe('c')
        expect(reader.hasMore()).toBe(false)
    })

    it('should handle invalid unicode characters', () => {
        const buffer = Buffer.from([0xff, 0xff])
        const reader = new BufferReader(buffer)
        expect(reader.readUnicodeChar()).toBe('?')
    })

    it('should handle invalid multi-byte sequences', () => {
        const buffer = Buffer.from([0xc0]) // Invalid 2-byte sequence start
        const reader = new BufferReader(buffer)
        expect(reader.readUnicodeChar()).toBe('?')
    })

    it('should handle buffer boundaries', () => {
        const buffer = Buffer.from([0xf0, 0x9f, 0x98]) // Incomplete grinning face
        const reader = new BufferReader(buffer)
        expect(reader.readUnicodeChar()).toBe('?')
    })

    it('should get the current offset', () => {
        const buffer = Buffer.from([0x12, 0x34])
        const reader = new BufferReader(buffer)
        expect(reader.getOffset()).toBe(0)
        reader.readUInt8()
        expect(reader.getOffset()).toBe(1)
    })
})
