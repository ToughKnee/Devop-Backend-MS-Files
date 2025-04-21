# Entity-Relationship Diagram for UCR Connect

```mermaid
erDiagram
    User ||--o{ UserSettings : has
    User ||--o{ Post : creates
    User ||--o{ Comment : makes
    User ||--o{ Like : gives
    User ||--o{ Report : submits
    User ||--o{ Notification : receives
    User }o--o{ Topic : subscribes
    User ||--o{ MediaFile : uploads
    AdminUser ||--o{ Report : manages
    AdminUser ||--o{ Topic : creates
    AdminUser ||--o{ Notification : sends
    
    Post ||--o{ Comment : has
    Post ||--o{ Like : receives
    Post ||--o{ MediaFile : contains
    Post ||--o{ Report : receives
    Post {
        uuid id PK
        uuid user_id FK
        text content
        timestamp created_at
        timestamp updated_at
        boolean is_active
        boolean is_edited
    }

    User {
        uuid id PK
        string email UK
        string password_hash
        string token
        string username
        string full_name
        string profile_picture
        enum role
        boolean is_active
        timestamp created_at
        timestamp last_login
    }

    UserSettings {
        uuid id PK
        uuid user_id FK
        boolean private_profile
        string language
        string theme
        json notification_preferences
    }

    Comment {
        uuid id PK
        uuid post_id FK
        uuid user_id FK
        text content
        timestamp created_at
        timestamp updated_at
    }

    Like {
        uuid id PK
        uuid user_id FK
        uuid post_id FK
        timestamp created_at
    }

    MediaFile {
        uuid id PK
        uuid post_id FK
        string file_url
        enum media_type
        timestamp created_at
    }

    Report {
        uuid id PK
        uuid reporter_id FK
        uuid reported_content_id FK
        enum content_type
        string reason
        enum status
        timestamp created_at
        uuid resolver_id FK
    }

    Notification {
        uuid id PK
        uuid user_id FK
        uuid topic_id FK
        string title
        string content
        boolean is_read
        timestamp created_at
        enum notification_type
    }

    Topic {
        uuid id PK
        string name
        string description
        timestamp created_at
        uuid created_by FK
    }

    AdminUser {
        uuid id PK
        string email UK
        string password_hash
        string full_name
        enum admin_role
        timestamp created_at
        timestamp last_login
    }
```

## Entity Descriptions

### User
- Main user entity for regular application users
- Stores authentication and profile information
- Linked to posts, comments, likes, and settings

### UserSettings
- Stores user preferences and configurations
- One-to-one relationship with User
- Handles privacy, language, and theme settings

### Post
- Main content entity for user publications
- Can contain text and media files
- Tracked for edits and active status

### Comment
- User comments on posts
- Tracked for edits
- Linked to both user and post

### Like
- Represents user likes on posts
- Simple relationship between user and post
- Timestamp for analytics

### MediaFile
- Stores information about uploaded media (images/GIFs)
- Linked to posts and users
- Tracks file metadata

### Report
- Handles content moderation reports
- Can be linked to various content types
- Tracks resolution status

### Notification
- System and user-generated notifications
- Can be linked to topics for mass notifications
- Tracks read status

### Topic
- Groups notifications for mass sending
- Created and managed by admins
- Users can subscribe to topics

### AdminUser
- Separate entity for administrative users
- Enhanced permissions and capabilities
- Manages reports and notifications

## Design Considerations

1. **Scalability**
   - UUID usage for primary keys
   - Separate tables for different content types
   - Efficient indexing structure

2. **Performance**
   - Denormalization where needed for read performance
   - Timestamp tracking for caching strategies
   - Efficient relationship design

3. **Security**
   - Separate admin user table
   - Role-based access control
   - Audit trail capabilities

4. **Data Integrity**
   - Foreign key relationships
   - Status tracking for content
   - Soft delete capabilities

5. **Compliance**
   - User privacy settings
   - Content moderation capabilities
   - Data retention tracking