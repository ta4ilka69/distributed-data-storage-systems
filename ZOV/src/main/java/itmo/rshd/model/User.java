package itmo.rshd.model;

import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import lombok.Data;

@Data
@Document(collection = "users")
public class User {
    @Id
    private String id;
    private String username;
    private Double socialRating;
    private SocialStatus status;
    private Location currentLocation;
    private boolean active = true;
}
