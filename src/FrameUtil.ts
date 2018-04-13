import Frame from "./Frame";

export default class FrameUtil {

  static build(options: {fin: boolean, opcode: number, mask: boolean, data: string|Buffer}): Buffer {
    const finfo = Buffer.allocUnsafe(2);
    finfo[0] = ((options.fin ? 1 : 0) << 7) + options.opcode;
    let len = options.data.length;
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
    const data = Buffer.from(options.data as any);
    const ret = extendPayloadLength ? [finfo, extendPayloadLength, data] : [finfo, data];
    return Buffer.concat(ret);
  }

  static mask() {
  }

  static unmask() {
  }
}