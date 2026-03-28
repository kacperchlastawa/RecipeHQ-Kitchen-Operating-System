#!/bin/bash
awslocal s3api head-bucket --bucket recipe-photos 2>/dev/null || awslocal s3 mb s3://recipe-photos
echo "S3 Bucket check completed."