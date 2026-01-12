# ---------- Build stage ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy everything needed for dependency resolution
COPY bartr-framework bartr-framework
COPY bartr-user-service bartr-user-service

# Build framework + user-profile
RUN mvn -pl bartr-user-service/user-profile -am clean package -DskipTests


# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /build/bartr-user-service/user-profile/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
