FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

# copy framework first
COPY bartr-framework bartr-framework
WORKDIR /build/bartr-framework
RUN mvn clean install -DskipTests

# now build user service
WORKDIR /build
COPY bartr-user-service bartr-user-service
WORKDIR /build/bartr-user-service
RUN mvn -pl user-profile -am clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/bartr-user-service/user-profile/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
