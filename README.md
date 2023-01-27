# Rendering with node-mapnik on AWS

The repo provides an example of [Mapbox Vector Tile](https://github.com/mapbox/vector-tile-spec) rendering with node-mapnik on AWS.

- The rendering is done on [AWS Lambda](https://aws.amazon.com/lambda/), using [node-mapnik](https://github.com/mapnik/node-mapnik) installed via [container image support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/).
- The data is stored in [AWS RDS](https://aws.amazon.com/rds/), specifically using the `aurora-postgresql` engine.
- The example leverages the [AWS CLI vs](https://aws.amazon.com/cli/)

The specific versions used are:

 - Node v18 via [`public.ecr.aws/lambda/nodejs:18`(https://gallery.ecr.aws/lambda/nodejs) which is based on the `Amazon Linux 2` execution environment
 - The latest, at time of writing, node-mapnik release: [`mapnik@4.5.9`](https://www.npmjs.com/package/mapnik)
 - AWS RDS `aurora-postgresql@13.6`
 - Docker version `20.10.21, build baeda1f`
