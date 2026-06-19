/*
 * Tiny ZIP builder using STORE method only.
 * Images are already compressed, so no-compression ZIP is fast and dependency-free.
 */
(function () {
  const encoder = new TextEncoder();
  let crcTable = null;

  function makeCrcTable() {
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      table[n] = c >>> 0;
    }
    return table;
  }

  function crc32(bytes) {
    if (!crcTable) crcTable = makeCrcTable();
    let c = 0xffffffff;
    for (let i = 0; i < bytes.length; i++) c = crcTable[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  }

  function dosTime(date) {
    const h = date.getHours();
    const m = date.getMinutes();
    const s = Math.floor(date.getSeconds() / 2);
    return (h << 11) | (m << 5) | s;
  }

  function dosDate(date) {
    const y = Math.max(date.getFullYear(), 1980) - 1980;
    const m = date.getMonth() + 1;
    const d = date.getDate();
    return (y << 9) | (m << 5) | d;
  }

  function u16(value) {
    const b = new Uint8Array(2);
    const v = new DataView(b.buffer);
    v.setUint16(0, value, true);
    return b;
  }

  function u32(value) {
    const b = new Uint8Array(4);
    const v = new DataView(b.buffer);
    v.setUint32(0, value >>> 0, true);
    return b;
  }

  function concat(parts) {
    let total = 0;
    for (const part of parts) total += part.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const part of parts) {
      out.set(part, offset);
      offset += part.length;
    }
    return out;
  }

  class SimpleZip {
    constructor() {
      this.files = [];
    }

    addFile(name, data, date = new Date()) {
      const cleanName = String(name).replace(/^\/+/, '').replace(/\\/g, '/');
      const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
      this.files.push({ name: cleanName, nameBytes: encoder.encode(cleanName), bytes, date, crc: crc32(bytes) });
    }

    toBlob() {
      const localParts = [];
      const centralParts = [];
      let offset = 0;

      for (const file of this.files) {
        const time = dosTime(file.date);
        const date = dosDate(file.date);
        const size = file.bytes.length;

        const localHeader = concat([
          u32(0x04034b50),
          u16(20),
          u16(0),
          u16(0),
          u16(time),
          u16(date),
          u32(file.crc),
          u32(size),
          u32(size),
          u16(file.nameBytes.length),
          u16(0),
          file.nameBytes
        ]);
        localParts.push(localHeader, file.bytes);

        const centralHeader = concat([
          u32(0x02014b50),
          u16(20),
          u16(20),
          u16(0),
          u16(0),
          u16(time),
          u16(date),
          u32(file.crc),
          u32(size),
          u32(size),
          u16(file.nameBytes.length),
          u16(0),
          u16(0),
          u16(0),
          u16(0),
          u32(0),
          u32(offset),
          file.nameBytes
        ]);
        centralParts.push(centralHeader);
        offset += localHeader.length + size;
      }

      const centralStart = offset;
      const central = concat(centralParts);
      const end = concat([
        u32(0x06054b50),
        u16(0),
        u16(0),
        u16(this.files.length),
        u16(this.files.length),
        u32(central.length),
        u32(centralStart),
        u16(0)
      ]);

      return new Blob([...localParts, central, end], { type: 'application/zip' });
    }
  }

  window.SimpleZip = SimpleZip;
})();
