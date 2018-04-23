import * as crypto from 'crypto';

export default class Util {

  static build(options: {data?: string|Buffer|undefined, fin: boolean, opcode: number, mask?: boolean}) {
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

    finfo[1] = (options.mask ? 0x80 : 0x00) + len;
    const buf = extendPayloadLength ? [finfo, extendPayloadLength] : [finfo];
    const data = Buffer.from(<any>options.data);

    if (options.mask) {
      const mask = crypto.randomBytes(4);
      buf.push(mask);
      const maskedData = Util.maskOrUnmask(mask, data);
      buf.push(maskedData);
    } else {
      buf.push(data);
    }

    return Buffer.concat(buf);
  }

  static maskOrUnmask(key: Buffer, message: Buffer): Buffer {
    return <Buffer>message.map((p, i) => p ^ (<Buffer>key)[i%4])
  }
}