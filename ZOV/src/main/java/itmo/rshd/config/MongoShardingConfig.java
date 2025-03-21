package itmo.rshd.config;

import com.mongodb.client.MongoClient;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.SimpleMongoClientDatabaseFactory;

import jakarta.annotation.PostConstruct;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;

@Configuration
public class MongoShardingConfig {

    private final MongoClient mongoClient;
    private final MongoTemplate mongoTemplate;
    
    @Value("${spring.data.mongodb.database}")
    private String databaseName;
    
    @Autowired
    public MongoShardingConfig(MongoClient mongoClient, MongoTemplate mongoTemplate) {
        this.mongoClient = mongoClient;
        this.mongoTemplate = mongoTemplate;
    }
    
    @PostConstruct
    public void configureSharding() {
        try {
            // Connect to admin database to run sharding commands
            MongoDatabase adminDb = mongoClient.getDatabase("admin");
            
            // Enable sharding for the database
            adminDb.runCommand(new Document("enableSharding", databaseName));
            
            // Configure sharded collections with appropriate shard keys
            
            // Shard users collection by regionId - good for location-based queries
            Document shardUsers = new Document("shardCollection", databaseName + ".users")
                    .append("key", new Document("regionId", 1));
            adminDb.runCommand(shardUsers);
            
            // Shard missiles collection by supplyDepotId - good for grouping missiles by depot
            Document shardMissiles = new Document("shardCollection", databaseName + ".missiles")
                    .append("key", new Document("supplyDepotId", 1));
            adminDb.runCommand(shardMissiles);
            
            // Shard regions collection by parentRegionId - good for hierarchical region lookups
            Document shardRegions = new Document("shardCollection", databaseName + ".regions")
                    .append("key", new Document("parentRegionId", 1));
            adminDb.runCommand(shardRegions);
            
            System.out.println("MongoDB sharding configured successfully for database: " + databaseName);
        } catch (Exception e) {
            System.err.println("Error configuring MongoDB sharding: " + e.getMessage());
            e.printStackTrace();
        }
    }
} 