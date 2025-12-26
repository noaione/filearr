import prisma from '@@/server/utils/db'

export default defineTask({
  meta: {
    name: 'db:cleanup',
    description: 'Cleans up expired shared files from the database',
  },
  async run() {
    console.log('Starting database cleanup task for expired shared folders...')

    const now = new Date()
    const sharedFolders = await prisma.sharedFolder.findMany({
      where: {
        expiresAt: {
          lt: now,
        }
      }
    })

    if (sharedFolders.length > 0) {
      console.log(`Found ${sharedFolders.length} expired shared folders to delete.`)
      await prisma.sharedFolder.deleteMany({
        where: {
          id: {
            in: sharedFolders.map(file => file.id)
          }
        }
      })
      console.log('Expired shared folders has been cleaned up!')
    } else {
      console.log('No expired shared folders to clean up.')
    }

    console.log('Starting database cleanup task for expired shared files...')
    const sharedFiles = await prisma.sharedFile.findMany({
      where: {
        expiresAt: {
          lt: now,
        }
      }
    })

    if (sharedFiles.length > 0) {
      console.log(`Found ${sharedFiles.length} expired shared files to delete.`)
      await prisma.sharedFile.deleteMany({
        where: {
          id: {
            in: sharedFiles.map(file => file.id)
          }
        }
      })
      console.log('Expired shared files has been cleaned up!')
    } else {
      console.log('No expired shared files to clean up.')
    }

    return { result: 'Success' }
  }
})