import Util from '../src/FrameUtil';

describe('FrameUtil test', () => {
  test('can mask and unmask message', () => {
    const msg = "Hello worlde";
    const keyBuf = Buffer.allocUnsafe(4);
    keyBuf.write("this is key");
    const maskedMsg = Util.maskOrUnmask(keyBuf, Buffer.from(msg));
    expect(maskedMsg).not.toBe(msg);
    const unmaskedMsg = Util.maskOrUnmask(keyBuf, maskedMsg);
    expect(unmaskedMsg.toString()).toBe(msg);
  });
});