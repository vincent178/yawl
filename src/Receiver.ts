import * as stream from 'stream';
import Util from './FrameUtil';

export default class Receiver extends stream.Writable {

  private _fin: boolean;
  private _opcode: number;
  private _buffers: Buffer;
  private _payloadLen: number;
  private _maskingKey: Buffer;
  private _message: Buffer|string;
  private _fragments: Buffer[];


  constructor() {
    super();
    this.resetAll();
  }

  _write(chunk: Buffer, encoding: string, cb: Function) {
    if (this._opcode === 0x08) return cb();

    this._buffers = this._buffers ? Buffer.concat([this._buffers, chunk]) : chunk;

    if (this._payloadLen === 0) {
      this.getInfo();
    }
    this.getData();
  }

  getInfo() {
    const buf = this.consume(2);

    // indicate finnal fragment in a message
    this._fin = (buf[0] & 0x80) === 0x80;

    const rsv1 = (buf[0] & 0x40) === 0x40;
    const rsv2 = (buf[0] & 0x20) === 0x20;
    const rsv3 = (buf[0] & 0x10) === 0x10;
    if (rsv1 === true || rsv2 === true || rsv3 === true) {
      throw new WebSocketError(0);
    }

    // interpretation of the payload data
    // 0 continuation frame 
    // 1 text frame
    // 2 binary frame
    // 8 close frame
    // 9 ping frame
    // 10 pong frame
    this._opcode = buf[0] & 0x0f;
    if (this._fin === false && (this._opcode >= 8)) {
      throw new WebSocketError(1);
    }

    // masked message flag 
    const mask = (buf[1] & 0x80) === 0x80;
    if (!mask) {
      throw new WebSocketError(2);
    }

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

  getData() {
    if (this._payloadLen > this._buffers.length) {
      return;
    }

    this._message = this.consume(this._payloadLen);
    if (this._maskingKey) {
      this._message = Util.maskOrUnmask(this._maskingKey, this._message);
    } 

    this._fragments.push(this._message);

    if (!this._fin) {
      this.reset();
      return;
    }

    const fragments = Buffer.concat(this._fragments);
    if (this._opcode === 8) {

      // this.emit('close', fragments.toString())
      // setTimeout(() => {
      //   this._socket.end();
      // }, 0);

    } else if (this._opcode === 1) {
      this.emit('message', fragments.toString());
    } else {
      this.emit('message', fragments);
    }

    this.resetAll();
  }

  consume(n: number) {
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



/*
 * 0 -> rsv non-zero error
 * 1 -> control fragmented error
 * 2 -> unmask error
 */
class WebSocketError extends Error {

  public code: number;

  constructor(code: number) {
    super();
    this.code = code;
    Error.captureStackTrace(this, WebSocketError)
  }
};
