import { Address4, Address6 } from 'ip-address'
import type { H3Event } from 'h3'

type IPAddress = Address4 | Address6

// Local IPv4 address
const ip4Subnet0 = new Address4('0.0.0.0/8')
const ip4Subnet24 = new Address4('10.0.0.0/8')
const ip4Subnet20 = new Address4('172.16.0.0/12')
const ip4Subnet16 = new Address4('192.168.0.0/16')

// Local IPv6 address
const ip6Subnet0 = new Address6('::ffff/64')

const cloudflareIpv4Blocks = [
  '173.245.48.0/20',
  '103.21.244.0/22',
  '103.22.200.0/22',
  '103.31.4.0/22',
  '141.101.64.0/18',
  '108.162.192.0/18',
  '190.93.240.0/20',
  '188.114.96.0/20',
  '197.234.240.0/22',
  '198.41.128.0/17',
  '162.158.0.0/15',
  '104.16.0.0/13',
  '104.24.0.0/14',
  '172.64.0.0/13',
  '131.0.72.0/22',
].map((ip) => new Address4(ip))
const cloudflareIpv6Blocks = [
  '2400:cb00::/32',
  '2606:4700::/32',
  '2803:f800::/32',
  '2405:b500::/32',
  '2405:8100::/32',
  '2a06:98c0::/29',
  '2c0f:f248::/32',
].map((ip) => new Address6(ip))

/**
 * Collect the first valid IP address from the given list.
 */
function collectValidIp(ips?: string | null): IPAddress[] {
  if (!ips) {
    return []
  }

  const splitIps = ips.split(',').map((ip) => ip.trim())

  return splitIps
    .map((ip) => {
      if (Address6.isValid(ip)) {
        const parsed = new Address6(ip)
        if (parsed.isLinkLocal() || parsed.isLoopback() || parsed.isMulticast() || parsed.isInSubnet(ip6Subnet0)) {
          return null
        }

        return parsed
      }
      if (Address4.isValid(ip)) {
        const parsed = new Address4(ip)
        // Check if not link local or any localhost address
        if (
          parsed.isMulticast() ||
          parsed.isInSubnet(ip4Subnet0) ||
          parsed.isInSubnet(ip4Subnet24) ||
          parsed.isInSubnet(ip4Subnet20) ||
          parsed.isInSubnet(ip4Subnet16)
        ) {
          return null
        }

        return parsed
      }

      return null
    })
    .filter((ip) => ip !== null)
}

/**
 * Filter out IP addresses that belong to Cloudflare
 */
function filterIpBlocks(ipBlock: IPAddress[]): IPAddress[] {
  return ipBlock.filter((ip) => {
    if (ip instanceof Address4) {
      return !cloudflareIpv4Blocks.some((block) => ip.isInSubnet(block))
    }

    if (ip instanceof Address6) {
      return !cloudflareIpv6Blocks.some((block) => ip.isInSubnet(block))
    }
    /* c8 ignore next -- Should not happens */
    return true
  })
}

/**
 * Get IP address from request
 * @param {import('node:http').IncomingMessage} req request object
 * @returns {string | null} IP address
 */
export function getUserIpAddress(req: H3Event): string | null {
  if (!req) {
    return null
  }

  const mergedIps = []

  // We check for Cloudflare then X-Forwarded-For then X-Real-IP then req.ip
  const headers = getRequestHeaders(req)
  if (headers) {
    const cfConnectingIp = headers['cf-connecting-ip']
    const cfConnectingIpv6 = headers['cf-connecting-ipv6']
    const doConnectingIp = headers['do-connecting-ip']
    const fastlyClientIp = headers['fastly-client-ip']
    const trueClientIp = headers['true-client-ip']

    const xClientIp = headers['x-client-ip']
    const xForwardedFor = headers['x-forwarded-for']
    const xForwarded = headers['x-forwarded']
    const forwardedFor = headers['x-forwarded']
    const { forwarded } = headers

    mergedIps.push(...collectValidIp(cfConnectingIp))
    mergedIps.push(...collectValidIp(cfConnectingIpv6))
    mergedIps.push(...collectValidIp(doConnectingIp))
    mergedIps.push(...collectValidIp(fastlyClientIp))
    mergedIps.push(...collectValidIp(trueClientIp))
    mergedIps.push(...collectValidIp(xClientIp))
    mergedIps.push(...collectValidIp(xForwardedFor))
    mergedIps.push(...collectValidIp(xForwarded))
    mergedIps.push(...collectValidIp(forwardedFor))
    mergedIps.push(...collectValidIp(forwarded))
  }

  const socket = req.node?.req?.socket
  const socketRemoteAddress = socket?.remoteAddress
  const ipAddr = getRequestIP(req, { xForwardedFor: false })

  mergedIps.push(...collectValidIp(socketRemoteAddress))
  mergedIps.push(...collectValidIp(ipAddr))

  const filteredIps = filterIpBlocks(mergedIps)
  if (filteredIps.length > 0) {
    return filteredIps[0].correctForm()
  }

  return null
}
