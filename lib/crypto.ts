import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

function getKey() {
  const KEY_HEX = process.env.ENCRYPTION_KEY;
  if (!KEY_HEX) {
    return Buffer.alloc(32); 
  }
  return Buffer.from(KEY_HEX, 'hex');
}

export function encryptPhone(phone: string): string {
  try {
    const KEY = getKey();
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
    
    let encrypted = cipher.update(phone, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    return iv.toString('hex') + authTag.toString('hex') + encrypted;
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error('Encryption failed');
  }
}

export function decryptPhone(encryptedData: string): string {
  try {
    const KEY = getKey();
    const iv = Buffer.from(encryptedData.slice(0, 32), 'hex');
    const authTag = Buffer.from(encryptedData.slice(32, 64), 'hex');
    const encrypted = encryptedData.slice(64);
    
    const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    return "Error Decrypting"; 
  }
}