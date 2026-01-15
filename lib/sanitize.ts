import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export function sanitizeInput(input: string): string {
  const cleaned = DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
  
  return validator.escape(validator.trim(cleaned));
}

export function validatePhone(phone: string): boolean {
  const cleaned = phone.replace(/\s+/g, '');
  return /^[6-9]\d{9}$/.test(cleaned);
}