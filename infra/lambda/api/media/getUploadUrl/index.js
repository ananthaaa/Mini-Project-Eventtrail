const { S3Client } = require('@aws-sdk/client-s3');
const { createPresignedPost } = require('@aws-sdk/s3-presigned-post');
const crypto = require('crypto');

const s3Client = new S3Client();
const BUCKET_NAME = process.env.MEDIA_BUCKET_NAME;
const CLOUDFRONT_DOMAIN = process.env.CLOUDFRONT_DOMAIN;

exports.handler = async (event) => {
  try {
    const queryParams = event.queryStringParameters || {};
    const type = queryParams.type || 'image/jpeg';
    const prefix = queryParams.prefix || 'events';
    const extension = type.split('/')[1] || 'jpg';
    
    // Generate a unique filename
    const key = `${prefix}/${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`;

    // Max 5 MB file size
    const MAX_FILE_SIZE = 5 * 1024 * 1024;

    const { url, fields } = await createPresignedPost(s3Client, {
      Bucket: process.env.MEDIA_BUCKET_NAME,
      Key: key,
      Conditions: [
        ['content-length-range', 0, 5242880], // 5 MB max
        ['eq', '$Content-Type', type]
      ],
      Fields: {
        'Content-Type': type
      },
      Expires: 300 // 5 minutes
    });

    const fileUrl = `https://${process.env.MEDIA_DOMAIN}/${key}`;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ uploadUrl: url, fields, fileUrl }),
    };
  } catch (error) {
    console.error('Error generating presigned post:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({ error: 'Failed to generate upload URL' }),
    };
  }
};
