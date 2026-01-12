# ---------- Build stage ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy parent pom
COPY pom.xml ./pom.xml

# Copy module pom
COPY user-profile/pom.xml user-profile/pom.xml

# Copy source
COPY user-profile/src user-profile/src

# Build only user-profile module
RUN mvn -pl user-profile -am clean package -DskipTests


# ---------- Runtime stage ----------
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /build/user-profile/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java","-jar","app.jar"]
