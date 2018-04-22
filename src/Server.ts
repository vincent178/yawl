import * as EventEmitter from 'events';
import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import WebSocket from './WebSocket';

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export type IServerOptions = {
  // custom server
  server?: http.Server;

  // simple built in server
  port?: number;
  host?: string;
  backlog?: number;
  callback?: Function;
}

/*
 *  WebSocket Server class
 *    * handle upgrade request
 *    * receive data frame
 * 
 *  TODO: <v1.0> websocket extensions
 */
export default class Server extends EventEmitter {

  private _server: http.Server;

  constructor(options: IServerOptions) {
    super();

    if (!options.port && !options.server) {
      throw new TypeError('one of "port" or "server" options must be specified');
    }

    if (options.port) {
      this._server = http.createServer((_, res) => {
        const body = http.STATUS_CODES[426];
        res.writeHead(426, {
          'Content-Length': (body as any).length,
          'Content-Type': 'text/plain'
        });
        res.end(body);
      });
      this._server.listen(options.port, options.host, options.backlog, options.callback);
    } 

    if (options.server) {
      this._server = options.server;
    }

    this._server.on('upgrade', this.onUpgrade.bind(this));
  }

  private onUpgrade(req: http.IncomingMessage, socket: net.Socket, head: Buffer) {

    if (
      req.method === "GET" && 
      +req.httpVersion >= 1.1 && 
      req.headers.host && 
      req.headers.upgrade && 
      /websocket/.test(req.headers.upgrade) && 
      /Upgrade/.test(<any>req.headers.connection) &&
      req.headers.origin && // if request coming from browser, this feild is required
      req.headers['sec-websocket-key'] && 
      req.headers['sec-websocket-version'] === '13'
    ) {

      this.handShake(req, socket);
      const ws = new WebSocket(socket, head);
      this.emit('connection', ws);
      socket.on('data', buf => ws.onData(buf));
      ws.on('error', () => {
      });
    } else if (req.headers['sec-websocket-version'] !== '13') {
      this.abortHandShake(socket, 400, 'Sec-WebSocket-Version: 13');
    } else {
      this.abortHandShake(socket, 400);
    }
  }

  private handShake(req: http.IncomingMessage, socket: net.Socket) {
    const key = req.headers['sec-websocket-key'];
    const hash = crypto.createHash('sha1');
    hash.update(`${key}${GUID}`);
    socket.write(
      'HTTP/1.1 101 Switching Protocols\r\n' +
      'Upgrade: webSocket\r\n' +
      'Connection: upgrade\r\n' +
      `Sec-WebSocket-Accept: ${hash.digest('base64')}\r\n` + 
      '\r\n'
    );
  }

  private abortHandShake(socket: net.Socket, code: number, data?: string) {
    socket.write(
      `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r\n` +
      'Connection: close\r\n' +
      'Content-type: text/html\r\n' +
      data ? `${data}\r\n` : null + 
      '\r\n'
    );
  }
}