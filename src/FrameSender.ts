import * as net from 'net';

/*
 * FrameBuilder class
 *   * build textual frame
 *   * build binary frame
 *   * build other control frame
 */
export default class FrameSender {

  private _socket: net.Socket;

  constructor(socket: net.Socket) {
    this._socket = socket;
  }

  // send text/binary data frame
  send(data: string|Buffer) {
    let opcode;

    if (typeof data === 'string') {
      opcode = 1;
    } else if (Buffer.isBuffer(data)) {
      opcode = 2;
    } else {
      throw new TypeError('invalid arguments, only support send string or Buffer');
    }

    this._send({data, opcode, fin: true});
  }

  ping(data?: string|Buffer) {
    this._send({data, opcode: 9, fin: true});
  }

  pong(data?: string|Buffer) {
    this._send({data, opcode: 10, fin: true});
  }

  // send close frame
  close(code?: number, reason?: string) {
    let data;

    if (code) {
      if (reason) {
        data = Buffer.allocUnsafe(2 + Buffer.byteLength(reason));
        data.writeUInt16BE(code, 0);
        data.write(reason, 2);
      } else {
        data = Buffer.allocUnsafe(2);
        data.writeUInt16BE(code, 0);
      }
    }
    this._send({data, opcode: 8, fin: true})
  }

  // generic method to build frame
  private _send(options: {data?: string|Buffer|undefined, fin: boolean, opcode: number}) {
    const finfo = Buffer.allocUnsafe(2);
    finfo[0] = (options.fin ? 0x80 : 0x00) + options.opcode;
    let len = options.data ? options.data.length : 0;
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
    const info = extendPayloadLength ? [finfo, extendPayloadLength] : [finfo];
    this._socket.write(Buffer.concat(info));
    this._socket.write(options.data);
  }
}