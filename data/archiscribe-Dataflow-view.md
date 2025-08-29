# ArchiMate View name: Dataflow View

This view shows the data flows of the primary system components.

## Elements

### Web App
- Type: ApplicationComponent
- Documentation: Public facing responsive web application.
- Properties:
  - Repository: org/webapp/src/

### API Gateway Service
- Type: ApplicationComponent
- Documentation: API Gateway Service to expose the backend business logic to the client web application.
- Properties:
  - Repository: org/apigateway/src/
  - Port: 9001

### App Interface
- Type: ApplicationInterface

### Core Application Service
- Type: ApplicationComponent
- Documentation: Microservice to process requests for the primary business domain.

## Relationships

- From **App Interface** to **Web App**
  - Type: Flow
  - Name: Client Data Access
  - Documentation: Public facing data access
  - Properties:
    - Protocol: HTTPS
- From **API Gateway Service** to **App Interface**
  - Type: Composition
- From **Core Application Service** to **API Gateway Service**
  - Type: Flow