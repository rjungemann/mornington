import { initCache } from './cache';

async function main() {
  const cache = initCache()
  await cache?.flush()
  process.exit()
}

main()