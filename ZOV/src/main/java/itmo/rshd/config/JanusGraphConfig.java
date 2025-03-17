package itmo.rshd.config;

import org.apache.tinkerpop.gremlin.process.traversal.dsl.graph.GraphTraversalSource;
import org.janusgraph.core.JanusGraph;
import org.janusgraph.core.JanusGraphFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

@Configuration
public class JanusGraphConfig {

    @Bean
    public JanusGraph janusGraph() throws Exception {
        String configFile = new ClassPathResource("anus.properties").getFile().getAbsolutePath();
        return JanusGraphFactory.open(configFile);
    }

    @Bean
    public GraphTraversalSource traversalSource(JanusGraph janusGraph) {
        return janusGraph.traversal();
    }
}