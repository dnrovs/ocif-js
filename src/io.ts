export class BufferReader {
    private buffer: Buffer
    private offset: number

    constructor(buffer: Buffer) {
        this.buffer = buffer
        this.offset = 0
    }

    public getOffset(): number {
        return this.offset
    }

    public hasMore(): boolean {
        return this.offset < this.buffer.length
    }

    public readUInt8(): number {
        const value = this.buffer.readUInt8(this.offset)
        this.offset += 1
        return value
    }

    public readUInt16BE(): number {
        const value = this.buffer.readUInt16BE(this.offset)
        this.offset += 2
        return value
    }

    public readString(
        length: number,
        encoding: BufferEncoding = 'utf-8'
    ): string {
        const value = this.buffer.toString(
            encoding,
            this.offset,
            this.offset + length
        )
        this.offset += length
        return value
    }

    public readUnicodeChar(): string {
        const firstByte = this.buffer[this.offset]
        let charLength = 0

        if ((firstByte & 0x80) === 0) {
            charLength = 1
        } else if ((firstByte & 0xe0) === 0xc0) {
            charLength = 2
        } else if ((firstByte & 0xf0) === 0xe0) {
            charLength = 3
        } else if ((firstByte & 0xf8) === 0xf0) {
            charLength = 4
        } else {
            this.offset++
            return '?'
        }

        if (this.offset + charLength > this.buffer.length) {
            this.offset = this.buffer.length
            return '?'
        }

        const char = this.buffer.toString(
            'utf-8',
            this.offset,
            this.offset + charLength
        )
        this.offset += charLength
        return char
    }
}
