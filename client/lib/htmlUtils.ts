/**
 * Utility functions for HTML processing
 */

/**
 * Decode HTML entities in a string
 * @param text - The text containing HTML entities
 * @returns Decoded text
 */
export const decodeHtmlEntities = (text: string): string => {
  if (!text) return '';
  
  // Create a temporary textarea element to decode HTML entities
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
};

/**
 * Check if a string is a URL/link
 * @param text - The text to check
 * @returns True if the text is a URL
 */
export const isUrl = (text: string): boolean => {
  if (!text) return false;
  
  const urlPattern = /^(https?:\/\/|www\.|maps\.|goo\.gl|sharelok|maps\.app\.goo\.gl)/i;
  return urlPattern.test(text);
};

/**
 * Format address for display with proper link handling
 * @param address - The address string
 * @param maxLength - Maximum length for display (default: 50)
 * @returns Formatted address object with link info
 */
export const formatAddressForDisplay = (address: string, maxLength: number = 50) => {
  if (!address) return { text: '', isLink: false, url: '', displayText: '' };
  
  const decodedAddress = decodeHtmlEntities(address);
  const isLink = isUrl(decodedAddress);
  
  return {
    text: decodedAddress,
    isLink,
    url: isLink ? decodedAddress : '',
    displayText: decodedAddress.length > maxLength ? `${decodedAddress.substring(0, maxLength)}...` : decodedAddress
  };
};

/**
 * Create a clickable link component props
 * @param url - The URL to link to
 * @param displayText - The text to display
 * @param className - Additional CSS classes
 * @returns Props for a link element
 */
export const createLinkProps = (url: string, displayText: string, className: string = '') => ({
  href: url,
  target: '_blank',
  rel: 'noopener noreferrer',
  className: `hover:underline break-all ${className}`,
  title: 'Klik untuk membuka lokasi'
});
