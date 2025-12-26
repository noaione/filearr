import { createHmac, type Hmac, timingSafeEqual } from 'crypto'
import { resolve, normalize } from 'path'
import { stat, readdir, realpath } from 'fs/promises'
import { nanoid } from 'nanoid'

const config = useRuntimeConfig()

/**
 * Normalize and validate file path to prevent directory traversal attacks
 */
export function sanitizePath(userPath: string, baseDir: string): string {
  // Normalize the path
  const normalized = normalize(userPath)

  // Resolve to absolute path
  const absolute = resolve(baseDir, normalized)

  // Ensure the resolved path is within the base directory
  if (!absolute.startsWith(baseDir)) {
    throw createError({
      statusCode: 403,
      message: 'Access denied: Invalid path',
    })
  }

  return absolute
}

/**
 * Get the expiry time in UNIX timestamp format
 */
export function getExpiryTime(): number {
  const now = Math.floor(Date.now() / 1000);
  return now + config.signatureExpiry;
}

/**
 * Generate a secure signed token for shared folders
 */
export function generateShareToken(): string {
  return nanoid(32)
}

/**
 * Sign a file path to prevent tampering
 */
export function signFilePath(path: string, shareToken: string, expiry: number, isBulk = false): Hmac {
  const secret = config.sessionSecret
  const hmac = createHmac('sha256', secret)
  hmac.update(shareToken)
  hmac.update(path)
  hmac.update(expiry.toString())
  if (isBulk) {
    hmac.update('bulk-is-path')
  }
  return hmac
}

/**
 * Verify a signed file path
 */
export function verifyFileSignature(path: string, shareToken: string, signature: string, expiry: number, isBulk = false): boolean {
  const expected = signFilePath(path, shareToken, expiry, isBulk)
  const signatureBuffer = Buffer.from(signature, 'hex')
  return timingSafeEqual(signatureBuffer, expected.digest())
}

/**
 * Get file/folder information
 */
export async function getFileInfo(absolutePath: string) {
  try {
    const realPath = await realpath(absolutePath)
    const stats = await stat(realPath)
    return {
      isDirectory: stats.isDirectory(),
      isFile: stats.isFile(),
      size: stats.size,
      modified: stats.mtime,
    }
  } catch (error) {
    throw createError({
      statusCode: 404,
      message: 'File or folder not found',
    })
  }
}

/**
 * Get the configured files directory
 */
export function getFilesDirectory(): string {
  return resolve(process.cwd(), config.filesDirectory)
}

/**
 * Precheck total size of files for bulk download
 */
export async function precheckFilesSize(files: string[], maxSizeBytes: number) {
  let totalSize = 0
  for (const file of files) {
    const info = await getFileInfo(file)
    if (info.isFile) {
      totalSize += info.size
      if (totalSize > maxSizeBytes) {
        throw createError({
          statusCode: 413,
          message: 'Selected files exceed maximum allowed size for bulk download',
        })
      }
    }
  }

  return totalSize
}
