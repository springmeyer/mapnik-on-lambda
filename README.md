# Rendering with node-mapnik on AWS

The repo provides an example of rendering with node-mapnik on AWS lambda using [Mapbox Vector Tile](https://github.com/mapbox/vector-tile-spec) functionality.

The rendering is done on [AWS Lambda](https://aws.amazon.com/lambda/), using [node-mapnik](https://github.com/mapnik/node-mapnik) installed via [container image support](https://aws.amazon.com/blogs/aws/new-for-aws-lambda-container-image-support/).

Overall this is possible because node-mapnik, despite being a C++ application, is distributed as a binary module that works across a wide range of linux distributions (including Amazon Linux 2). Additionally node-mapnik supports both creating Vector tiles and rendering images from Vector Tile sources. The example code included here creates vector tiles since that is most simple. But it could easily be modified to render vector tile sources into images using methods similar to https://github.com/mapbox/tilelive-vector.

The specific versions used are:

 - Node v18 via [`public.ecr.aws/lambda/nodejs:18`](https://gallery.ecr.aws/lambda/nodejs) which is based on the `Amazon Linux 2` execution environment
 - Node-mapnik release: [`mapnik@4.5.9`](https://www.npmjs.com/package/mapnik)

This setup was tested with these additional versions:

 - AWS RDS `aurora-postgresql@13.6`
 - Docker version `20.10.21, build baeda1f`

## Requirements

### Working PostGIS database endpoint

You will need a PostgreSQL-based RDS database [with PostGIS enabled](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/Appendix.PostgreSQL.CommonDBATasks.PostGIS.html) and a table with a column of [`geometry` type](https://www.postgis.net/workshops/postgis-intro/geometries.html).

This database can either be an engine type of [`aurora-postgresql`](https://docs.aws.amazon.com/AmazonRDS/latest/AuroraUserGuide/Aurora.AuroraPostgreSQL.html) or [`postgres`](https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html).

## Configuring

First, get the endpoint URL for your database. If you don't know this you can get it with:

```
aws rds describe-db-cluster-endpoints
```

If using Aurora you'll want to use the reader endpoint. It will look something like:

```
cluster-name.cluster-ro-cwu1qccramnk.region.rds.amazonaws.com
```

Once you know the endpoint then open `lambda-app/map.xml` and edit the XML:
  - Change the word `HOST` to be the endpoint address of the RDS instance
  - Change the word `PASSWORD` to be the database password
  - Change the word `TABLE` to point to the database table that has a `geometry` field
  - Change the word `GEOMETRY` to reference the column name for the `geometry` field

## Building

Now you are ready to build the lambda image. Issue a command like:

```
docker build -t mapnik-on-lambda:version1 ./lambda-app --platform="linux/amd64"
```

Note: the image name of `mapnik-on-lambda:version1` can be anything you choose. You will see `mapnik-on-lambda:version1` referenced in the example commands below, so if you change this name make sure to change it in the below commands as well.

## Testing locally

If your database is publicly accessible you can now test the application locally.

If not publicly accessible, skip to the next section that details testing on AWS.

To test locally first run the image:

```
docker run -p 9000:8080 mapnik-on-lambda:version1
```

And then in another terminal issue this command:

```
curl -XPOST "http://localhost:9000/2015-03-31/functions/function/invocations" -d '{}'
```

If everything is working okay and the container can access your remote database, you should receive back a JSON response detailing the geometries in the table. If things are not configured correctly you should instead receive or an error that indicates the misconfiguration.

Note: this demo is only designed to work with data in WGS84 Geographic that is low enough resolution to display at zoom level zero. If your data is in a different projection and large then you will likely need to modify the `./lambda-app/app.js` code to do something different in order to test your configuration.


## Testing on AWS

### Publishing to ECR

First we need to publish the locally built container image to `AWS ECR`.

Assuming that `REGION` and `ACCOUNT_ID` are set in your environment you can publish your container like:

```
aws ecr get-login-password --region ${REGION} | docker login --username AWS --password-stdin ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com
docker tag mapnik-on-lambda:version1 ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/${REPOSITORY}
docker push ${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mapnik-on-lambda:version1
```

Once the `push` works your image will now be addressable with a URI like:

```
${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mapnik-on-lambda:version1
```

### Creating lambda function

Next we are ready to create a lambda function that references the image URI. Since we are pulling data from RDS the lambda function will need to declare a VPC config that gives access to your database.

To do this you will need to know the VPC subnet and security group details as well as the role the lambda will run under.

Then you can create a lambda function like:

```
IMAGE_URI="${ACCOUNT_ID}.dkr.ecr.${REGION}.amazonaws.com/mapnik-on-lambda:version1"

aws lambda create-function \
  --package-type Image \
  --code "ImageUri=${IMAGE_URI}" \
  --function-name your-lambda-function-name \
  --vpc-config SubnetIds=subnet-A,subnet-B,SecurityGroupIds=sg-A \
  --role "arn:aws:iam::${ACCOUNT_ID}:role/lambda-role-name"
```

Where you'll need to modify the words `your-lambda-function-name`, `lambda-role-name`, `subnet-A,subnet-B`, and `sg-A` to match your environment.

Once the lambda function is created and in the active state, you should be ready to test. This can be done via a local terminal like:

```
aws lambda invoke \
    --function-name your-lambda-function-name \
    response.json
```

Which should either return a JSON response detailing the geometries in the table or an error that indicates a misconfiguration.
