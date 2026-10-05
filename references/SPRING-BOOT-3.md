# Spring Boot 3 Reference Guide

## Table of Contents
- [Overview](#overview)
- [System Requirements](#system-requirements)
- [Key Version Upgrades](#key-version-upgrades)
- [Critical Considerations When Creating Spring Boot 3 Projects](#critical-considerations-when-creating-spring-boot-3-projects)
- [Jackson 2 Conventions](#jackson-2-conventions)
- [Testing Changes](#testing-changes)
- [AOT and Native Image Notes](#aot-and-native-image-notes)
- [Performance](#performance)
- [Startup Banner (Required)](#startup-banner-required)
- [Checklist for New Projects](#checklist-for-new-projects)

## Overview

This guide covers the key characteristics of Spring Boot 3.x and what to consider when
creating new Spring Boot 3 projects.

**Major Version:** 3.x (this skill tracks the latest stable 3.x, currently 3.5.x)
**Based on:** Spring Framework 6.x, Jakarta EE 9+ (Servlet 5.0+)

> **How the Spring Boot version is chosen.** `versions.json` sets
> `springBootPreferredMajor` to `3`, and `scripts/lib/versions.mjs` resolves the
> highest **stable** 3.x release from Maven Central's `maven-metadata.xml`
> (pre-releases such as `-M1`, `-RC1` and `-SNAPSHOT` are ignored). If Maven Central
> is unreachable, it falls back to `springBootFallback` with a warning. Override
> either with `--boot-version`.

> **Generation no longer uses start.spring.io.** The Initializr serves only the
> current Boot line and returns HTTP 400 for 3.x requests, so projects are written
> locally by `scripts/lib/scaffold.mjs`.

## System Requirements

### Minimum Requirements

1. Java: 17+ (this skill targets **Java 21**)
2. GraalVM: 21+ (for native images)
3. Jakarta EE: 9+ baseline (Servlet 5.0+)
4. Maven: 3.8+ (Maven only — no Gradle in this skill)

## Key Version Upgrades

1. Spring Framework 6.x
2. Spring Data 2023.x/2024.x
3. Spring Security 6.x
4. Hibernate 6.x
5. Testcontainers 1.19+
6. Jackson 2.x
7. Tomcat 10.1

## Critical Considerations When Creating Spring Boot 3 Projects

⚠️ **Most Common Mistakes** — always verify these when generating code:

0. **Maven-only / No Lombok / Hibernate ddl-auto**: Do not generate Gradle builds; keep Lombok out of the default build (an opt-in `-Plombok` profile ships in `pom.xml`, and Enforcer/ArchUnit guard against accidental use). Use Hibernate `ddl-auto` for schema management (no Flyway, no Liquibase).

1. **Jakarta EE namespace**: `javax.*` → `jakarta.*` for all persistence, servlet and validation APIs. `jakarta.persistence.Entity` replaces `javax.persistence.Entity`, and so on.

2. **MySQL is the default database**, with H2 in-memory used for fast, container-free tests. See the [Database Best Practices](DATABASE.md).

3. **`.properties` over YAML**: the skill configures applications with `.properties` files so that env-var placeholders stay simple.

4. **Never read `.env`**: secrets live in `.env` (gitignored). Only `.env.sample` may be displayed.

### Jackson 2 Conventions

Boot 3.x uses **Jackson 2**, so every type stays on the classic `com.fasterxml.jackson`
coordinates — there is no `tools.jackson.*` namespace.

```java
// ✅ CORRECT — annotations
import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonFormat;

// ✅ CORRECT — API classes
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.JsonProcessingException;
```

**❌ WRONG** — Jackson 3 packages do not exist in Boot 3:

```java
import tools.jackson.databind.ObjectMapper;   // ❌ Jackson 3 only (Boot 4)
import tools.jackson.annotation.JsonProperty;  // ❌ this package never exists
```

> If you later migrate to Boot 4, Jackson 3 moves API classes to `tools.jackson.*`
> while **annotations stay in `com.fasterxml.jackson.annotation`**.

## Testing Changes

- `@WebMvcTest` is still `org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest` and is included in `spring-boot-starter-test`. (The relocated `org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest` package is a **Boot 4** change.)
- `@MockBean` / `@SpyBean` are still available in Boot 3. Spring Framework's `@MockitoBean` / `@MockitoSpyBean` work too and are the safer long-term choice; `@MockBean` is deprecated in Boot 4.
- Testcontainers 1.x is managed by the Boot BOM. Use `org.testcontainers.containers.MySQLContainer<?>` and `@ServiceConnection`; see the [Testing Guide](TEST.md).

## AOT and Native Image Notes

- `process-aot` (used by `Dockerfile-aot`) benefits from an explicit main class. The generated `pom.xml` sets `<start-class>` and the Spring Boot Maven plugin's `<mainClass>` so the goal never has to guess.
- The `native` Maven profile is provided by `spring-boot-starter-parent`. The `aot` and `crac` profiles are injected by the generator.
- See the [GraalVM Guide](GRAALVM.md) for native builds and runtime hints.

## Performance

- **JVM startup**: prefer CDS/AppCDS or Spring AOT over a full native image when you only need faster startup and easier debugging.
- **Native image**: fastest startup and lowest memory, at the cost of a slower build. Measure before committing — see the [Performance chapter](https://github.com/jdubois/dr-jskill/blob/main/workshop/07-performance.md).
- Always verify with `jcmd`/`-XX:+PrintCompilation` style measurements rather than assumptions.

## Startup Banner (Required)

Every generated project ships `config/StartupInfoListener.java`, which listens for
`ApplicationReadyEvent` and prints the URLs where the app (and the Vite dev server,
if a `frontend/` directory exists) can be reached.

> **Boot 3 package layout gotcha.** The two types live in *different* packages:
> `org.springframework.boot.web.server.WebServer` and
> `org.springframework.boot.web.context.WebServerApplicationContext`.
> Boot 4 collapsed both into `org.springframework.boot.web.server.context`. Getting
> this wrong is the single most common compile error when porting the banner between
> Boot lines.

The listener resolves the port from the running `WebServer` rather than reading
`server.port`, so it stays correct under `@SpringBootTest(webEnvironment = RANDOM_PORT)`.

## Checklist for New Projects

- [ ] Java 21 toolchain, Maven 3.8+, no Gradle
- [ ] Spring Boot 3.x from Maven Central (stable release only)
- [ ] MySQL at runtime, H2 for tests
- [ ] `jakarta.*` imports throughout (no `javax.*`)
- [ ] Jackson 2 imports (`com.fasterxml.jackson.*`, no `tools.jackson.*`)
- [ ] `spring.jpa.hibernate.ddl-auto` for schema, no Flyway/Liquibase
- [ ] `.properties` configuration, secrets in `.env` only
- [ ] Startup banner wired via `StartupInfoListener`
- [ ] `./mvnw clean install`, `./mvnw test` and `./mvnw verify` all pass
