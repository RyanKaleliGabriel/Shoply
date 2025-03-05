## Scalable e-commerce platform using microservices architecture and Docker

> The platform handles various aspects of an online store, such as product catalog management, user authentication, shopping cart, payment processing, and order management. Each of these features is implemented as separate microservices, allowing for independent development, deployment, and scaling.

## Take Away

This project offerrd a comprehensive approach to building a modern, scalable e-commerce platform and will give you hands-on experience with Docker, microservices, and related technologies. After completing this project, I've had a solid understanding of how to design, develop, and deploy complex distributed systems.

## Core Microservices

- User Service: Handles user registration, authentication, and profile management. Implemented using JWT and OAuth2

- Product Catalog Service: Manages product listings, categories, and inventory.

- Shopping Cart Service: Manages users’ shopping carts, including adding/removing items and updating quantities.

- Order Service: Processes orders, including placing orders, tracking order status, and managing order history.

- Payment Service: Handles payment processing, integrating with external payment gateways. Safaricom's mpesa and stripe used for implementation

- Notification Service: Sends email and emailnotifications for various events (e.g., order confirmation, shipping updates). Mailtrap used.

## Additional Components

 - API Gateway: Serves as the entry point for all client requests, routing them to the appropriate microservice. Nginx used for this.

 - Service Discovery: Automatically detected and manages service instances. Consul used for this

 - Centralized Logging: Aggregated logs from all microservices for easy monitoring and debugging. Grafana's loki used for this

 - Docker & Docker Compose: Containerized each microservice and manages their orchestration, networking, and scaling. Docker Compose can be used to define and manage multi-container applications.
 
 - CI/CD Pipeline: Automates the build, test, and deployment process of each microservice.  Github actions used for this

 - Deployed the Platform: Used Kubernetes for production deployment. Implement auto-scaling and load balancing.
