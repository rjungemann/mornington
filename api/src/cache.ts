import memjs from 'memjs'
import { logger } from './logging'

export const initCache = () => {
  let cacheClient: memjs.Client | undefined
  const memcachedServers = process.env.MEMCACHEDCLOUD_SERVERS
  if (memcachedServers) {
    const username = process.env.MEMCACHEDCLOUD_USERNAME
    const password = process.env.MEMCACHEDCLOUD_PASSWORD
    logger.info({ servers: memcachedServers, username }, 'Using memcached client')
    cacheClient = memjs.Client.create(memcachedServers, { username, password })
  }

  return cacheClient
}