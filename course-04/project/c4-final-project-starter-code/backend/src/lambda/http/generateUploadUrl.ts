import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as middy from 'middy'
import { cors, httpErrorHandler } from 'middy/middlewares'
import * as uuid from 'uuid'
import { createLogger } from '../../utils/logger'
import { setAttachmentUrl } from '../../helpers/todos'
import { AttachmentUtils } from '../../helpers/attachmentUtils'

const logger = createLogger('generateUploadUrl')
const attachmentUtils = new AttachmentUtils()

const bucketName = process.env.ATTACHMENTS_S3_BUCKET

function getAttachmentUrl(imageId: string): string {
  return `https://${bucketName}.s3.amazonaws.com/${imageId}`
}

export const handler = middy(
  async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Processing event to generate upload url: ', event)

    const todoId = event.pathParameters.todoId
    const authorizationHeader = event.headers.Authorization
    const jwtToken = authorizationHeader.split(' ')[1]
    const imageId = uuid.v4()

    // set the attachmentUrl for a TODO item
    setAttachmentUrl(todoId, getAttachmentUrl(imageId), jwtToken)

    const presignedUrl = attachmentUtils.getPresignedAttachmentUrl(todoId)

    return {
      statusCode: 201,
      body: JSON.stringify({
        uploadUrl: presignedUrl
      })
    }
    // DONE: Return a presigned URL to upload a file for a TODO item with the provided id
  }
)

handler.use(httpErrorHandler()).use(
  cors({
    credentials: true
  })
)
