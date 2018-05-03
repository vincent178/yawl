import * as net from 'net';
import Util from './Util';

/*
 * Sender class
 *   * build textual frame
 *   * build binary frame
 *   * build other control frame
 */
export default class Sender {

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
  close(code?: number, reason?: string, cb?: Function) {
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
    this._send({data, opcode: 8, fin: true, cb})
  }

  // generic method to build frame
  private _send(options: {data?: string|Buffer|undefined, fin: boolean, opcode: number, mask?: boolean, cb?: Function}) {
    this._socket.write(Util.frame(options), options.cb);
  }
}