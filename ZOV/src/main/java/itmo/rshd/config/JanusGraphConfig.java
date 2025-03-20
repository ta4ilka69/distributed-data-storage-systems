package itmo.rshd.config;

import org.apache.tinkerpop.gremlin.driver.Cluster;
import org.apache.tinkerpop.gremlin.driver.remote.DriverRemoteConnection;
import org.apache.tinkerpop.gremlin.driver.ser.GraphBinaryMessageSerializerV1;
import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import jakarta.annotation.PreDestroy;

import static org.apache.tinkerpop.gremlin.process.traversal.AnonymousTraversalSource.traversal;

@Configuration
public class JanusGraphConfig {

    private Cluster cluster;
    private GraphTraversalSource g;
    
    @Value("${janusgraph.enabled:true}")
    private boolean janusGraphEnabled;

    @Bean
    @Primary
    public GraphTraversalSource graphTraversalSource() {
        if (!janusGraphEnabled) {
            System.out.println("JanusGraph is disabled by configuration. Skipping graph connection.");
            return null;
        }
        
        try {
            // Use binary serialization instead of GraphSON
            // This tends to have fewer issues with complex types
            cluster = Cluster.build()
                    .addContactPoint("localhost")
                    .port(8182)
                    .serializer(new GraphBinaryMessageSerializerV1())
                    .maxConnectionPoolSize(2)
                    .maxWaitForConnection(5000)
                    .reconnectInterval(1000)
                    .enableSsl(false)
                    .create();
            
            g = traversal().withRemote(DriverRemoteConnection.using(cluster, "g"));
            
            System.out.println("Successfully connected to JanusGraph using binary serialization");
            return g;
        } catch (Exception e) {
            System.err.println("Error connecting to JanusGraph: " + e.getMessage());
            e.printStackTrace();
            System.out.println("*** WARNING: JanusGraph connection failed. Supply chain functionality will not be available. ***");
            return null;
        }
    }

    @PreDestroy
    public void closeGraph() {
        try {
            if (g != null) {
                g.close();
                System.out.println("Graph traversal source closed properly.");
            }
            
            if (cluster != null) {
                cluster.close();
                System.out.println("Gremlin cluster connection closed properly.");
            }
        } catch (Exception e) {
            System.err.println("Error while closing JanusGraph connections: " + e.getMessage());
        }
    }
}