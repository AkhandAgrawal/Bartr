# Use a stable Java 17 runtime
FROM eclipse-temurin:21-jre-alpine

# Set working directory inside container
WORKDIR /app

# Copy the built jar
ARG JAR_FILE=target/*.jar
COPY ${JAR_FILE} app.jar

# Expose port (Railway injects PORT dynamically)
EXPOSE 8080

# Run the application
ENTRYPOINT ["java","-jar","app.jar"]
