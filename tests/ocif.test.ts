import { describe, it, expect } from 'vitest'
import { OCIF } from '../src'
import * as fs from 'fs'
import * as path from 'path'
import { PNG } from 'pngjs'

describe('OCIF', () => {
    it('should create an image, save it, and load it back correctly', () => {
        const image = new OCIF(2, 1)
        image.setPixel(0, 0, {
            background: 0xff0000,
            foreground: 0x00ff00,
            alpha: 1,
            character: 'a'
        })
        image.setPixel(1, 0, {
            background: 0x0000ff,
            foreground: 0xffff00,
            alpha: 0.5,
            character: 'b'
        })

        for (const encoding of [5, 6, 7, 8]) {
            const savedBuffer = image.toBuffer(encoding)
            const reloadedImage = OCIF.fromBuffer(savedBuffer)

            expect(reloadedImage.width).toBe(image.width)
            expect(reloadedImage.height).toBe(image.height)
            expect(reloadedImage.pixels.length).toBe(image.pixels.length)
            for (let i = 0; i < image.pixels.length; i++) {
                expect(reloadedImage.pixels[i].character).toBe(
                    image.pixels[i].character
                )
                expect(reloadedImage.pixels[i].background).toBe(
                    image.pixels[i].background
                )
                expect(reloadedImage.pixels[i].foreground).toBe(
                    image.pixels[i].foreground
                )
                expect(reloadedImage.pixels[i].alpha).toBeCloseTo(
                    image.pixels[i].alpha
                )
            }
        }
    })

    it('should return undefined for out-of-bounds getPixel', () => {
        const image = new OCIF(1, 1)
        expect(image.getPixel(-1, -1)).toBeUndefined()
    })

    it('should handle out-of-bounds setPixel', () => {
        const image = new OCIF(1, 1)
        const originalPixel = image.getPixel(0, 0)
        image.setPixel(-1, -1, {
            background: 0,
            foreground: 0,
            alpha: 0,
            character: 'x'
        })
        expect(image.getPixel(0, 0)).toEqual(originalPixel)
    })

    it('should throw an error for unsupported encoding method on load', () => {
        const buffer = Buffer.from([0x4f, 0x43, 0x49, 0x46, 0x04])
        expect(() => OCIF.fromBuffer(buffer)).toThrow(
            'Unsupported encoding method: 4'
        )
    })

    it('should throw an error for invalid signature', () => {
        const buffer = Buffer.from('NOT_OCIF')
        expect(() => OCIF.fromBuffer(buffer)).toThrow('Invalid OCIF signature')
    })

    it('should throw an error for unsupported encoding method on save', () => {
        const image = new OCIF(1, 1)
        expect(() => image.toBuffer(4)).toThrow(
            'Unsupported encoding method: 4'
        )
    })

    it('should load HDD.pic', () => {
        const filePath = path.join(__dirname, 'fixtures', 'HDD.pic')
        const buffer = fs.readFileSync(filePath)
        const image = OCIF.fromBuffer(buffer)
        expect(image.width).toBe(8)
    })

    it('should convert an OCIF image to PNG', () => {
        const image = new OCIF(1, 1)
        image.setPixel(0, 0, {
            background: 0,
            foreground: 0xffffff,
            alpha: 1,
            character: 'a'
        })
        const pngBuffer = image.toPNG()

        expect(pngBuffer).toBeInstanceOf(Buffer)

        // Check for PNG signature
        expect(pngBuffer.slice(0, 8).toString('hex')).toBe('89504e470d0a1a0a')

        const png = PNG.sync.read(pngBuffer)
        expect(png.width).toBe(image.width * 8)
        expect(png.height).toBe(image.height * 16)
    })

    it('should scale the output PNG correctly', () => {
        const image = new OCIF(1, 1)
        image.setPixel(0, 0, {
            background: 0,
            foreground: 0xffffff,
            alpha: 1,
            character: 'a'
        })
        const pngBuffer = image.toPNG(2)
        const png = PNG.sync.read(pngBuffer)
        expect(png.width).toBe(image.width * 8 * 2)
        expect(png.height).toBe(image.height * 16 * 2)
    })

    it('should throw an error for invalid scale factor', () => {
        const image = new OCIF(1, 1)
        expect(() => image.toPNG(0)).toThrow(
            'Scale must be an integer greater than or equal to 1.'
        )
        expect(() => image.toPNG(1.5)).toThrow(
            'Scale must be an integer greater than or equal to 1.'
        )
    })

    it('should create an image with default fill', () => {
        const image = new OCIF(1, 1)
        const pixel = image.getPixel(0, 0)
        expect(pixel?.background).toBe(0x000000)
        expect(pixel?.foreground).toBe(0xffffff)
        expect(pixel?.alpha).toBe(1.0)
        expect(pixel?.character).toBe(' ')
    })
})
