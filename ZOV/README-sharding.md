# MongoDB Sharding Setup for ZOV Application

This document outlines the steps to set up a MongoDB sharded cluster for the ZOV application.

## Prerequisites

- MongoDB 4.4 or higher installed
- 3 servers/VMs for MongoDB nodes (can be on the same machine for development)

## Step 1: Set up Config Servers (Replica Set)

Config servers store the metadata for the sharded cluster.

```bash
# Create directories for config servers
mkdir -p /data/configdb/cfg1 /data/configdb/cfg2 /data/configdb/cfg3

# Start 3 config servers
mongod --configsvr --replSet configRS --port 27019 --dbpath /data/configdb/cfg1 --bind_ip localhost
mongod --configsvr --replSet configRS --port 27020 --dbpath /data/configdb/cfg2 --bind_ip localhost
mongod --configsvr --replSet configRS --port 27021 --dbpath /data/configdb/cfg3 --bind_ip localhost

# Initialize the config server replica set
mongosh --port 27019
```

In the MongoDB shell:
```javascript
rs.initiate({
  _id: "configRS",
  configsvr: true,
  members: [
    { _id: 0, host: "localhost:27019" },
    { _id: 1, host: "localhost:27020" },
    { _id: 2, host: "localhost:27021" }
  ]
})
```

## Step 2: Set up Shard Servers (Replica Sets)

Each shard is a replica set.

### Shard 1
```bash
# Create directories
mkdir -p /data/shard1/rs1 /data/shard1/rs2 /data/shard1/rs3

# Start shard 1 replica set members
mongod --shardsvr --replSet shard1RS --port 27022 --dbpath /data/shard1/rs1 --bind_ip localhost
mongod --shardsvr --replSet shard1RS --port 27023 --dbpath /data/shard1/rs2 --bind_ip localhost
mongod --shardsvr --replSet shard1RS --port 27024 --dbpath /data/shard1/rs3 --bind_ip localhost

# Initialize the shard replica set
mongosh --port 27022
```

In the MongoDB shell:
```javascript
rs.initiate({
  _id: "shard1RS",
  members: [
    { _id: 0, host: "localhost:27022" },
    { _id: 1, host: "localhost:27023" },
    { _id: 2, host: "localhost:27024" }
  ]
})
```

### Shard 2
```bash
# Create directories
mkdir -p /data/shard2/rs1 /data/shard2/rs2 /data/shard2/rs3

# Start shard 2 replica set members
mongod --shardsvr --replSet shard2RS --port 27025 --dbpath /data/shard2/rs1 --bind_ip localhost
mongod --shardsvr --replSet shard2RS --port 27026 --dbpath /data/shard2/rs2 --bind_ip localhost
mongod --shardsvr --replSet shard2RS --port 27027 --dbpath /data/shard2/rs3 --bind_ip localhost

# Initialize the shard replica set
mongosh --port 27025
```

In the MongoDB shell:
```javascript
rs.initiate({
  _id: "shard2RS",
  members: [
    { _id: 0, host: "localhost:27025" },
    { _id: 1, host: "localhost:27026" },
    { _id: 2, host: "localhost:27027" }
  ]
})
```

## Step 3: Set up Mongos Router

The mongos router is the interface between the application and the sharded cluster.

```bash
# Start mongos router
mongos --configdb configRS/localhost:27019,localhost:27020,localhost:27021 --port 27017 --bind_ip localhost
```

## Step 4: Add Shards to the Cluster

Connect to the mongos router:
```bash
mongosh --port 27017
```

In the MongoDB shell:
```javascript
// Add the two shards
sh.addShard("shard1RS/localhost:27022,localhost:27023,localhost:27024")
sh.addShard("shard2RS/localhost:27025,localhost:27026,localhost:27027")

// Check status
sh.status()
```

## Step 5: Enable Sharding for the Database and Collections

In the MongoDB shell:
```javascript
// Enable sharding for the ZOV database
sh.enableSharding("ZOV")

// Shard the collections with appropriate shard keys
// These keys match the ones used in the MongoShardingConfig.java file

// Users collection - sharded by regionId
db.adminCommand({shardCollection: "ZOV.users", key: {regionId: 1}})

// Missiles collection - sharded by supplyDepotId
db.adminCommand({shardCollection: "ZOV.missiles", key: {supplyDepotId: 1}})

// Regions collection - sharded by parentRegionId
db.adminCommand({shardCollection: "ZOV.regions", key: {parentRegionId: 1}})
```

## Step 6: Verify the Sharding Configuration

```javascript
// Check the sharding status
sh.status()

// Check distribution of data
db.users.getShardDistribution()
db.missiles.getShardDistribution()
db.regions.getShardDistribution()
```

## Step 7: Update the Application Configuration

Ensure your application.properties file contains the correct configuration to connect to the mongos router:

```properties
spring.data.mongodb.sharded=true
spring.data.mongodb.replica-set=rs0
spring.data.mongodb.uri=mongodb://localhost:27017/${spring.data.mongodb.database}
```

## Production Considerations

For production deployments:
- Use separate servers for each MongoDB process
- Implement security with authentication and authorization
- Use appropriate server specifications based on data size and workload
- Configure network settings properly, especially firewall rules
- Implement backup and monitoring solutions 