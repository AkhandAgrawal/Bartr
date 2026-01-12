FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /build

COPY user-service/pom.xml .
COPY user-service/src ./src

RUN mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
