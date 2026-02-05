import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Readable } from 'stream'

if (!process.env.R2_ACCOUNT_ID) {
  throw new Error('R2_ACCOUNT_ID is not set')
}

if (!process.env.R2_ACCESS_KEY_ID) {
  throw new Error('R2_ACCESS_KEY_ID is not set')
}

if (!process.env.R2_SECRET_ACCESS_KEY) {
  throw new Error('R2_SECRET_ACCESS_KEY is not set')
}

const R2_ENDPOINT = `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`

export const r2Client = new S3Client({
  region: 'auto',
  endpoint: R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'picobase-instances'

export async function uploadDatabase(instanceId: string, filePath: string): Promise<void> {
  const fs = await import('fs')
  const fileStream = fs.createReadStream(filePath)
  const key = `instances/${instanceId}/pb_data.db`

  await r2Client.send(
    new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: fileStream as any,
      ContentType: 'application/octet-stream',
    })
  )
}

export async function downloadDatabase(instanceId: string, outputPath: string): Promise<boolean> {
  const fs = await import('fs')
  const key = `instances/${instanceId}/pb_data.db`

  try {
    const response = await r2Client.send(
      new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )

    if (!response.Body) {
      return false
    }

    const writeStream = fs.createWriteStream(outputPath)
    const body = response.Body as Readable

    return new Promise((resolve, reject) => {
      body.pipe(writeStream)
      body.on('error', reject)
      writeStream.on('finish', () => resolve(true))
      writeStream.on('error', reject)
    })
  } catch (error: any) {
    if (error.name === 'NoSuchKey') {
      return false
    }
    throw error
  }
}

export async function databaseExists(instanceId: string): Promise<boolean> {
  const key = `instances/${instanceId}/pb_data.db`

  try {
    await r2Client.send(
      new HeadObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      })
    )
    return true
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false
    }
    throw error
  }
}

export async function deleteDatabase(instanceId: string): Promise<void> {
  const key = `instances/${instanceId}/pb_data.db`

  await r2Client.send(
    new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })
  )
}
