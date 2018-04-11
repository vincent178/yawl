import * as EventEmitter from 'events';
import * as net from 'net';
import * as fs from 'fs';

export default class WebSocket extends EventEmitter {

  private _socket: net.Socket;
  private _head: Buffer;
  private _buffers: Buffer;
  private _message: string|Buffer;
  private _maskingKey: Buffer;
  private _payloadLen: number;
  private _hasMore: boolean;

  constructor(socket: net.Socket, head: Buffer) {
    super();
    this._socket = socket;
    this._head = head;
    this._hasMore = false;
  }

  onData(buf: Buffer) {
   this._buffers = this._buffers ? Buffer.concat([this._buffers, buf]) : buf;

    if (!this._hasMore) {
      this.getInfo();
    }

    this.getData();
  }

  getInfo() {
    const buf = this.consume(2);

    const fin = (buf[0] & 0x80) === 0x80;
    const opcode = buf[0] & 0x0f;

    if (opcode === 1) {
      console.log("text message");
    } else if (opcode === 2) {
      console.log("binary message");
    } else {
      console.log(opcode);
    }

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

  getData() {
    if (this._payloadLen > this._buffers.length) {
      this._hasMore = true;
      return;
    }

    this._message = this.consume(this._payloadLen);
    if (this._maskingKey) {
      this._message = this._message.map((p, i) => p ^ (this._maskingKey as Buffer)[i%4]) as Buffer;
    } 

    if (this._payloadLen > 100) {
      fs.writeFile('tmp.jpg', this._message, () => {
        console.log('write to file successfully');
      });
    }
  }

  consume(n: number) {
    if (n > this._buffers.length) {
      this._buffers = Buffer.allocUnsafe(0);
      return this._buffers;
    }
    const ret = this._buffers.slice(0, n);
    this._buffers = this._buffers.slice(n);
    return ret;
  }

  send(data: string|Buffer) {
    const text = Buffer.from(data as any);
    const finfo = Buffer.allocUnsafe(2);
    finfo[0] = 0b10000001;
    finfo[1] = text.length;
    const ret = Buffer.concat([finfo, text]);
    this._socket.write(ret);
  }
}