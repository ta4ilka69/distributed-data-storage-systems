package itmo.rshd.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;
import org.springframework.data.mongodb.core.index.GeoSpatialIndexType;
import org.springframework.data.mongodb.core.index.GeospatialIndex;

import jakarta.annotation.PostConstruct;

@Configuration
public class MongoConfig {

    private final MongoTemplate mongoTemplate;

    @Autowired
    public MongoConfig(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @PostConstruct
    public void initIndices() {
        // Create indices for User collection
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("username", Sort.Direction.ASC).unique());
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("regionId", Sort.Direction.ASC));
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("districtId", Sort.Direction.ASC));
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("countryId", Sort.Direction.ASC));
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("status", Sort.Direction.ASC));
        mongoTemplate.indexOps("users").ensureIndex(new Index().on("socialRating", Sort.Direction.ASC));

        // Create geospatial index for user locations
        GeospatialIndex geoIndex = new GeospatialIndex("currentLocation");
        geoIndex.typed(GeoSpatialIndexType.GEO_2DSPHERE);
        mongoTemplate.indexOps("users").ensureIndex(geoIndex);

        // Create indices for Region collection
        mongoTemplate.indexOps("regions").ensureIndex(new Index().on("type", Sort.Direction.ASC));
        mongoTemplate.indexOps("regions").ensureIndex(new Index().on("parentRegionId", Sort.Direction.ASC));
        mongoTemplate.indexOps("regions").ensureIndex(new Index().on("underThreat", Sort.Direction.ASC));

        // Create geospatial index for region boundaries
        GeospatialIndex regionGeoIndex = new GeospatialIndex("boundaries");
        regionGeoIndex.typed(GeoSpatialIndexType.GEO_2DSPHERE);
        mongoTemplate.indexOps("regions").ensureIndex(regionGeoIndex);

        // Create indices for Missile collection
        mongoTemplate.indexOps("missiles").ensureIndex(new Index().on("type", Sort.Direction.ASC));
        mongoTemplate.indexOps("missiles").ensureIndex(new Index().on("status", Sort.Direction.ASC));
        mongoTemplate.indexOps("missiles").ensureIndex(new Index().on("supplyDepotId", Sort.Direction.ASC));
        mongoTemplate.indexOps("missiles").ensureIndex(new Index().on("range", Sort.Direction.ASC));

        // Create geospatial index for missile locations
        GeospatialIndex missileGeoIndex = new GeospatialIndex("currentLocation");
        missileGeoIndex.typed(GeoSpatialIndexType.GEO_2DSPHERE);
        mongoTemplate.indexOps("missiles").ensureIndex(missileGeoIndex);
    }
}
