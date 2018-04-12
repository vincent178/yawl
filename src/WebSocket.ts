import * as EventEmitter from 'events';
import * as net from 'net';

/* 
 *   WebSocket Framing Protocol
 * 
 *       0                   1                   2                   3
 *    0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1 2 3 4 5 6 7 8 9 0 1
 *   +-+-+-+-+-------+-+-------------+-------------------------------+
 *   |F|R|R|R| opcode|M| Payload len |    Extended payload length    |
 *   |I|S|S|S|  (4)  |A|     (7)     |             (16/64)           |
 *   |N|V|V|V|       |S|             |   (if payload len==126/127)   |
 *   | |1|2|3|       |K|             |                               |
 *   +-+-+-+-+-------+-+-------------+ - - - - - - - - - - - - - - - +
 *   |     Extended payload length continued, if payload len == 127  |
 *   + - - - - - - - - - - - - - - - +-------------------------------+
 *   |                               |Masking-key, if MASK set to 1  |
 *   +-------------------------------+-------------------------------+
 *   | Masking-key (continued)       |          Payload Data         |
 *   +-------------------------------- - - - - - - - - - - - - - - - +
 *   :                     Payload Data continued ...                :
 *   + - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - +
 *   |                     Payload Data continued ...                |
 *   +---------------------------------------------------------------+
 * 
 */
export default class WebSocket extends EventEmitter {

  private _socket: net.Socket;
  private _head: Buffer;
  private _buffers: Buffer;
  private _message: string|Buffer;
  private _maskingKey: Buffer;
  private _payloadLen: number;
  private _fin: boolean;
  private _fragments: Buffer[];

  constructor(socket: net.Socket, head: Buffer) {
    super();
    this._socket = socket;
    this._head = head;
    this.resetAll();
  }

  send(data: string|Buffer, options: {fin: boolean, mask: boolean} = {fin: true, mask: false}) {
    let opcode = 0;
    if (typeof data === 'string') {
      opcode = 1;
    } else if (Buffer.isBuffer(data)) {
      opcode = 2;
    }

    const finfo = Buffer.allocUnsafe(2);
    finfo[0] = ((options.fin ? 1 : 0) << 7) + opcode;
    let len = data.length;
    let extendPayloadLength;

    if (len >= 65536) {
      extendPayloadLength = Buffer.allocUnsafe(8);
      extendPayloadLength.writeUInt32BE(~~(len / 0xffffffff), 0);
      extendPayloadLength.writeUInt32BE(len & 0x00000000ffffffff, 4);
      len = 127;
    } else if (len > 125) {
      extendPayloadLength = Buffer.allocUnsafe(2);
      extendPayloadLength.writeUInt16BE(len, 0);
      len = 126;
    } 

    finfo[1] = len;
    data = Buffer.from(data as any);
    const ret = extendPayloadLength ? [finfo, extendPayloadLength, data] : [finfo, data];
    this._socket.write(Buffer.concat(ret as any));
  }


  onData(buf: Buffer) {
    this._buffers = this._buffers ? Buffer.concat([this._buffers, buf]) : buf;

    if (this._payloadLen === 0) {
      this.getInfo();
    }

    this.getData();
  }

  private getInfo() {
    const buf = this.consume(2);

    this._fin = (buf[0] & 0x80) === 0x80;
    const opcode = buf[0] & 0x0f;

    const mask = (buf[1] & 0x80) === 0x80;
    this._payloadLen = buf[1] & 0x7f;

    if (this._payloadLen === 126) {
      this._payloadLen = this.consume(2).readUInt16BE(0);
    } else if (this._payloadLen === 127) {
      const buf = this.consume(8);
      const n = buf.readUInt32BE(0);
      this._payloadLen = n * Math.pow(2, 32) + buf.readUInt32BE(4);
      if (this._payloadLen > Number.MAX_SAFE_INTEGER) {
        throw new RangeError(`Invalid WebSocket Frame: payload length is greater than ${Number.MAX_SAFE_INTEGER}`);
      }
    } 

    if (mask) {
      this._maskingKey = this.consume(4);
    }
  }

  private getData() {
    if (this._payloadLen > this._buffers.length) {
      return;
    }

    this._message = this.consume(this._payloadLen);
    if (this._maskingKey) {
      this._message = this._message.map((p, i) => p ^ (this._maskingKey as Buffer)[i%4]) as Buffer;
    } 

    if (!this._fin) {
      this._fragments.push(this._message);
      this.reset();
      return;
    }

    this.emit('message', Buffer.concat(this._fragments));
    this.resetAll();
  }

  private consume(n: number) {
    if (n > this._buffers.length) {
      this._buffers = null as any;
      throw new RangeError('Invalid WebSocket Frame Consume');
    }
    const ret = this._buffers.slice(0, n);
    this._buffers = this._buffers.slice(n);
    return ret;
  }

  private resetAll() {
    this._fragments = [];
    this.reset();
  }

  private reset() {
    this._payloadLen = 0;
    this._fin = false;
    this._message = null as any;
  }
}