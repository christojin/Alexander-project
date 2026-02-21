import { randomBytes, createCipheriv, createDecipheriv } from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;

function getEncryptionKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }
  // Support hex keys (64 chars = 32 bytes) or raw 32-byte strings
  if (key.length === 64 && /^[0-9a-fA-F]+$/.test(key)) {
    return Buffer.from(key, "hex");
  }
  const buf = Buffer.from(key, "utf-8");
  if (buf.length !== 32) {
    throw new Error(
      "ENCRYPTION_KEY must be exactly 32 bytes (or 64 hex characters)"
    );
  }
  return buf;
}

/**
 * Encrypt a plaintext string using AES-256-GCM.
 * Returns: base64 string of [iv (16) + authTag (16) + ciphertext]
 */
export function encrypt(plaintext: string): string {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv);

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf-8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  // Pack: iv + authTag + ciphertext
  const packed = Buffer.concat([iv, authTag, encrypted]);
  return packed.toString("base64");
}

/**
 * Decrypt a base64-encoded AES-256-GCM ciphertext.
 * Supports both new format (base64) and legacy ENC: prefix placeholder.
 */
export function decrypt(ciphertext: string): string {
  // Handle legacy placeholder format from development
  if (ciphertext.startsWith("ENC:")) {
    return ciphertext.slice(4);
  }

  const key = getEncryptionKey();
  const packed = Buffer.from(ciphertext, "base64");

  const iv = packed.subarray(0, IV_LENGTH);
  const authTag = packed.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH);
  const encrypted = packed.subarray(IV_LENGTH + AUTH_TAG_LENGTH);

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]);
  return decrypted.toString("utf-8");
}
