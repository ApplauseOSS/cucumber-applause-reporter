FROM 948223650506.dkr.ecr.us-east-1.amazonaws.com/applause/base-nodejs:14.0

# Create app directory
WORKDIR /usr/src/app

# update Node to 14 and install yarn. Versions fixed to make container builds reproducable
RUN npm install -g yarn@1.22.11

CMD [ "scripts/build.sh" ]