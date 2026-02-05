export const algorithm = {
  name: 'AES-GCM',
  length: 256,
}

const encoder = new TextEncoder()
const decoder = new TextDecoder()

export const str2ab = (str: string): ArrayBuffer => {
  return encoder.encode(str).buffer
}

export const ab2str = (buf: ArrayBuffer): string => {
  return decoder.decode(buf)
}

export const importKey = async (secretKey: string): Promise<CryptoKey> => {
  const keyData = encoder.encode(secretKey)
  const keyHash = await window.crypto.subtle.digest('SHA-256', keyData)

  return window.crypto.subtle.importKey('raw', keyHash, algorithm, false, [
    'encrypt',
    'decrypt',
  ])
}

export const encryptData = async (
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any,
  secretKey: string,
): Promise<string> => {
  try {
    const key = await importKey(secretKey)
    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encodedData = new TextEncoder().encode(JSON.stringify(data))

    const encryptedContent = await window.crypto.subtle.encrypt(
      {
        name: algorithm.name,
        iv: iv,
      },
      key,
      encodedData,
    )

    // Combine IV and encrypted data, then encode to base64 for transport
    const encryptedArray = new Uint8Array(
      iv.byteLength + encryptedContent.byteLength,
    )
    encryptedArray.set(iv, 0)
    encryptedArray.set(new Uint8Array(encryptedContent), iv.byteLength)

    // Convert to base64 string
    // Using a binary string conversion to ensure btoa works correctly
    let binary = ''
    const bytes = encryptedArray
    const len = bytes.byteLength
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    return window.btoa(binary)
  } catch (error) {
    console.error('Encryption failed:', error)
    throw new Error('Encryption failed')
  }
}

export const decryptData = async (
  encryptedData: string,
  secretKey: string,
// eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> => {
  try {
    const key = await importKey(secretKey)

    const binaryString = window.atob(encryptedData)
    const len = binaryString.length
    const bytes = new Uint8Array(len)
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }

    // Extract IV (first 12 bytes) and content
    const iv = bytes.slice(0, 12)
    const content = bytes.slice(12)

    const decryptedContent = await window.crypto.subtle.decrypt(
      {
        name: algorithm.name,
        iv: iv,
      },
      key,
      content,
    )

    const decodedData = new TextDecoder().decode(decryptedContent)
    return JSON.parse(decodedData)
  } catch (error) {
    console.error('Decryption failed:', error)
    throw new Error('Decryption failed')
  }
}
