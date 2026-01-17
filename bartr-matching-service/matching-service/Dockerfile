FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# 1️⃣ Build shared framework first
COPY bartr-framework bartr-framework
WORKDIR /build/bartr-framework
RUN mvn clean install -DskipTests

# 2️⃣ Build matching service
WORKDIR /build
COPY bartr-matching-service bartr-matching-service
WORKDIR /build/bartr-matching-service
RUN mvn -pl matching-service -am clean package -DskipTests

# 3️⃣ Runtime image
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/bartr-matching-service/matching-service/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
