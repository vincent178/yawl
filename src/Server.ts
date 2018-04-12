import * as EventEmitter from 'events';
import * as http from 'http';
import * as net from 'net';
import * as crypto from 'crypto';
import WebSocket from './WebSocket';

const GUID = "258EAFA5-E914-47DA-95CA-C5AB0DC85B11";

export type IServerOptions = {
  server?: http.Server;
  port?: number;
  host?: string;
  backlog?: number;
}

export default class Server extends EventEmitter {

  private _server: http.Server;

  constructor(options: IServerOptions, callback?: Function) {
    super();

    if (!options.port && !options.server) {
      throw new TypeError('One of "port" or "server" options must be specified');
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
      this._server.listen(options.port, options.host, options.backlog, callback);
    } 

    if (options.server) {
      this._server = options.server;
    }

    this._server.on('upgrade', this.onUpgrade.bind(this));
  }

  private onUpgrade(req: http.IncomingMessage, socket: net.Socket, head: Buffer) {
    this.handShake(req, socket);
    const ws = new WebSocket(socket, head);
    this.emit('connection', ws);
    socket.on('data', buf => ws.onData(buf));
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
}