const crypto = require("crypto");

// AES-GCM encryption: returns base64 ciphertext that encodes iv|tag|ciphertext
function aesGcmEncryptJSON(obj) {
  const iv = crypto.randomBytes(12);
  const key = crypto.randomBytes(32); // Buffer
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const data = Buffer.from(JSON.stringify(obj), "utf8");
  const enc = Buffer.concat([cipher.update(data), cipher.final()]);
  const tag = cipher.getAuthTag();
  // output: iv(12) + tag(16) + enc
  const payload = Buffer.concat([iv, tag, enc]).toString("base64");
  return { payload, key: key.toString("hex") };
}

function aesGcmDecryptBase64(payloadB64, keyHex) {
  const buf = Buffer.from(payloadB64, "base64");
  const iv = buf.slice(0,12);
  const tag = buf.slice(12,28);
  const enc = buf.slice(28);
  const key = Buffer.from(keyHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(tag);
  const dec = Buffer.concat([decipher.update(enc), decipher.final()]);
  return JSON.parse(dec.toString("utf8"));
}

module.exports = { aesGcmEncryptJSON, aesGcmDecryptBase64 };
