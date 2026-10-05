---
name: dr-jskill
description: "Creates Java + Spring Boot projects: Web applications, full-stack apps with Vue.js or Angular or React or vanilla JS, MySQL, REST APIs, and Docker. Use when creating Spring Boot projects, setting up Java microservices, or building enterprise applications with the Spring Framework."
metadata:
  recommended_model: gpt-5.5
---

# Spring Boot skill that follows Julien Dubois' best practices.

## Overview
This agent skill helps you create Spring Boot projects following [Julien Dubois](https://www.julien-dubois.com)' best practices. It provides tools and scripts to quickly bootstrap Spring Boot applications.

> **How projects are generated.** Earlier versions downloaded a starter zip from
> [https://start.spring.io](https://start.spring.io). The Initializr now only serves
> the current Spring Boot line (4.x) and answers **HTTP 400 for every 3.x request**,
> so it cannot generate a Boot 3 project. Generation is therefore performed locally
> by `scripts/lib/scaffold.mjs`: it writes the `pom.xml` (inheriting
> `spring-boot-starter-parent`) and the `src/` skeleton, and installs the Maven
> wrapper from Maven Central. The Spring Boot version is resolved from **Maven
> Central's `maven-metadata.xml`**, not from the Initializr.

**Recommended model:** Dr JSkill works best with **GPT-5.5**.

## Version Management

Centralized versions live in `versions.json`. All scripts read from it via `scripts/lib/versions.mjs` (JavaScript). Update this file to bump Java, Spring Boot fallback, MySQL, Node/npm, Testcontainers, etc.

## Prerequisites

1. Java 21 installed
2. Node.js 22.x and NPM 10.x (for front-end development)
3. Docker installed and running

## Capabilities
- Generate Spring Boot projects with predefined configurations
- Support for various Spring Boot versions and dependencies
- Follow best practices for project structure and configuration
- Quick setup scripts for common use cases
- Docker support for containerized deployments
- Front-end development with multiple framework options:
  - **Vue.js 3** (default) - Progressive framework with Composition API
  - **React 18** - Popular library for building user interfaces
  - **Angular 18** - Full-featured framework with TypeScript
  - **Vanilla JavaScript** - No framework, pure ES6+ with Vite

## Usage

### Using the Scripts
This skill includes cross-platform JavaScript (Node.js) scripts in the `scripts/` directory that can be used to download pre-configured Spring Boot projects from start.spring.io. They work on Linux, macOS, and Windows.

**Unified launcher (cross-platform):**
```bash
node scripts/create-project my-app com.myco my-app com.myco.myapp 21 fullstack --output-dir /absolute/path/to/user/workspace
```

**Direct invocation:**
```bash
node scripts/create-project-latest.mjs my-app com.myco my-app com.myco.myapp 21 fullstack --output-dir /absolute/path/to/user/workspace
```

Flags supported:
- `--boot-version <x.y.z>` / `-BootVersion`: override Spring Boot version
- `--project-type basic|web|fullstack` / `-ProjectType`
- `--output-dir <absolute-path>`: create the generated project folder under this directory

**Output directory rule (important for Agent Skills):** bundled scripts are run from the skill directory root. When the user asks to create an app, pass `--output-dir` with the user's current working directory from the agent session so the generated project folder is created in the user's workspace, not inside the `dr-jskill` skill folder. Only omit `--output-dir` when running Dr JSkill's own tests, where generating inside the skill checkout is intentional.

> Tip: The `create-project-latest` script resolves the highest **stable 3.x** release from Maven Central and falls back to the configured `springBootFallback` when the network is unavailable. Override with `--boot-version` if needed.

### Latest Version Project 猸?Use the `create-project-latest.mjs` script to create a project with the **latest Spring Boot version** (automatically fetched):
```bash
node scripts/create-project-latest.mjs my-app com.mycompany my-app com.mycompany.myapp 21 web
```

Project types available:
- `basic` - Minimal Spring Boot project
- `web` - Web application with REST API capabilities
- `fullstack` - Complete application with database and security

### Basic Spring Boot Project
Use the `create-basic-project.mjs` script to create a basic Spring Boot project with essential dependencies:
```bash
node scripts/create-basic-project.mjs
```

### Web Application
Use the `create-web-project.mjs` script to create a Spring Boot web application with web dependencies:
```bash
node scripts/create-web-project.mjs
```

### Full-Stack Application
Use the `create-fullstack-project.mjs` script to create a comprehensive Spring Boot application with database, security, and web dependencies:
```bash
node scripts/create-fullstack-project.mjs
```

## Best Practices

When creating Spring Boot projects:

1. Use the latest Spring Boot version (currently 4.x) - the `create-project-latest.mjs` script automatically fetches it
2. **Review Spring Boot 3 critical considerations**: See [Spring Boot 3 Migration Guide](references/SPRING-BOOT-3.md) for Jackson 3 annotations and TestContainers configuration
3. Include Spring Boot Actuator for production-ready features
4. Use Spring Data JPA for database access
5. Use MySQL for database (H2 in-memory is used for fast unit tests) - see [Database Best Practices](references/DATABASE.md) for optimization
6. Use properties files for configuration - see [Configuration Best Practices](references/CONFIGURATION.md)
7. Set up foundational dotfiles: `.gitignore`, `.env.sample`, `.editorconfig`, `.gitattributes`, `.dockerignore`, optional `.vscode/`, `.devcontainer/` - see [Project Setup & Dotfiles](references/PROJECT-SETUP.md)
   - The `.env` file is the canonical location for local secrets; instruct users to copy `.env.sample` 鈫?`.env` and fill in real values
   - **NEVER read or expose `.env`**: it contains real secrets 鈥?do not `cat`, view, or print its contents; only `.env.sample` (placeholder values) may be read or displayed
8. Follow daily Git best practices for small branches, reviewed diffs, safe commits, pull requests, and worktrees - see [Git Best Practices](references/GIT.md)
9. Use `spring-boot-docker-compose` for automatic database startup during development - see [Docker Guide](references/DOCKER.md)
10. Follow RESTful API design principles
11. Configure proper logging with Logback - see [Logging Best Practices](references/LOGGING.md)
12. Use Maven for dependency management
13. Include Spring Boot DevTools for development productivity
14. Add Spring Security only when needed - see [Security Guide](references/SECURITY.md) for best practices
15. Configure Docker for containerized deployments - see [Docker Guide](references/DOCKER.md)
16. Enable GraalVM native image support for faster startup - see [GraalVM Guide](references/GRAALVM.md)
17. **Always ship a startup banner** that prints access URLs when the app is ready - see [Startup Banner](references/SPRING-BOOT-3.md#startup-banner-required)
18. The user must review changes before they are committed to git. Ask the user before initializing a Git repository, or running git commands.

## Java Code Intelligence (JDTLS) 猸?
Generated projects integrate with the **Eclipse JDT Language Server (JDTLS)** so AI agents can navigate, refactor, and diagnose Java code *semantically* rather than with text search. Each project ships both `.cursor/rules/dr-jskill-java.mdc` (**Cursor**) and a root `AGENTS.md` (**Codex**) that carry the same rules; the previous `.github/lsp.json` targeted GitHub Copilot CLI only and has been removed.

**For the AI agent**: when working on Java files, prefer the `lsp` tool over `grep`/`view`/`sed`. It understands imports, generics, inheritance, and Javadoc.

| Task | Use |
|------|-----|
| Find where a class/method is defined | `lsp goToDefinition` |
| Find callers before changing a signature | `lsp findReferences` or `incomingCalls` |
| Look up types, parameters, Javadoc | `lsp hover` |
| List symbols in a file | `lsp documentSymbol` |
| Search a class/method across the project | `lsp workspaceSymbol` |
| Rename safely across files | `lsp rename` (never sed) |
| Check compile errors before `./mvnw verify` | `ide-get_diagnostics` |

**Preference order for Java work: `lsp` 鈫?`grep` with `.java` glob 鈫?`view`.**

Install JDTLS once: `brew install jdtls` (or see [JDTLS guide](references/JDTLS.md) for other platforms). Full setup, gotchas, and editor integrations live in [references/JDTLS.md](references/JDTLS.md).

## Project Structure

The service layer is only included if it adds value (e.g. complex business logic). For simple CRUD applications, the controller can directly call the repository.

Generated projects follow the following recommended structure:
```plaintext
my-spring-boot-app/
鈹溾攢鈹€ .gitignore                 # Java + front-end + secrets (see references/PROJECT-SETUP.md)
鈹溾攢鈹€ .env.sample                # Template for local env vars; .env is gitignored
鈹溾攢鈹€ .editorconfig              # Consistent formatting across IDEs
鈹溾攢鈹€ .gitattributes             # Normalize line endings, better diffs
鈹溾攢鈹€ .dockerignore              # Slim Docker build contexts
鈹溾攢鈹€ .vscode/                   # Optional editor recommendations
鈹?  鈹溾攢鈹€ extensions.json
鈹?  鈹斺攢鈹€ settings.json
鈹溾攢鈹€ .devcontainer/             # Optional Dev Container (Java 21 + Node 22 + MySQL)
鈹?  鈹溾攢鈹€ devcontainer.json
鈹?  鈹斺攢鈹€ docker-compose.yml
鈹溾攢鈹€ AGENTS.md                  # AI agent rules (Codex); Cursor reads .cursor/rules/*.mdc
鈹溾攢鈹€ .cursor/rules/             # AI agent rules (Cursor)
鈹溾攢鈹€ src/
鈹?  鈹溾攢鈹€ main/
鈹?  鈹?  鈹溾攢鈹€ java/
鈹?  鈹?  鈹?  鈹斺攢鈹€ com/example/app/
鈹?  鈹?  鈹?      鈹溾攢鈹€ Application.java
鈹?  鈹?  鈹?      鈹溾攢鈹€ config/
鈹?  鈹?  鈹?      鈹溾攢鈹€ controller/
鈹?  鈹?  鈹?      鈹溾攢鈹€ service/         # Only included if needed
鈹?  鈹?  鈹?      鈹溾攢鈹€ repository/
鈹?  鈹?  鈹?      鈹斺攢鈹€ domain/
鈹?  鈹?  鈹斺攢鈹€ resources/
鈹?  鈹?      鈹溾攢鈹€ static/              # Front-end web assets (HTML, CSS, JS)
鈹?  鈹?      鈹?  鈹溾攢鈹€ index.html
鈹?  鈹?      鈹?  鈹溾攢鈹€ css/
鈹?  鈹?      鈹?  鈹?  鈹斺攢鈹€ styles.css
鈹?  鈹?      鈹?  鈹溾攢鈹€ js/
鈹?  鈹?      鈹?  鈹?  鈹斺攢鈹€ app.js
鈹?  鈹?      鈹?  鈹斺攢鈹€ images/
鈹?  鈹?      鈹斺攢鈹€ application.properties
鈹?  鈹斺攢鈹€ test/
鈹?      鈹斺攢鈹€ java/
鈹?          鈹斺攢鈹€ com/example/app/
鈹?              鈹溾攢鈹€ config/
鈹?              鈹溾攢鈹€ controller/
鈹?              鈹溾攢鈹€ service/         # Only included if needed
鈹?              鈹溾攢鈹€ repository/
鈹?              鈹斺攢鈹€ domain/
鈹溾攢鈹€ Dockerfile                   # JVM image (jlink runtime + distroless)
鈹溾攢鈹€ Dockerfile-aot               # JVM + Spring AOT image
鈹溾攢鈹€ Dockerfile-native            # GraalVM native image
鈹溾攢鈹€ Dockerfile-crac              # CRaC (fast-restore) image
鈹溾攢鈹€ checkpoint-and-run.sh        # CRaC entrypoint helper
鈹溾攢鈹€ compose.yaml                 # Dev database (spring-boot-docker-compose)
鈹溾攢鈹€ docker-compose.yml           # Full stack with MySQL (JVM)
鈹溾攢鈹€ docker-compose-aot.yml       # Full stack with MySQL (AOT)
鈹溾攢鈹€ docker-compose-native.yml    # Full stack with MySQL (native)
鈹溾攢鈹€ docker-compose-crac.yml      # CRaC app (database-free)
鈹溾攢鈹€ pom.xml
鈹斺攢鈹€ README.md
```

## Dependencies

Generated projects include: Spring Web, Spring Data JPA, Spring Boot Actuator, DevTools, MySQL, H2 (test scope), Validation, Docker Compose support, Test Starter with JUnit 5, and TestContainers.

## Configuration

Use `.properties` files (not YAML), externalize secrets via environment variables, and leverage `@ConfigurationProperties` for type safety. See the [Configuration Guide](references/CONFIGURATION.md) for profiles, secrets management, and common patterns.

The `.env` file is the single local secret store 鈥?never read or print it; only `.env.sample` (placeholder values) may be shown.

**For database optimization**, see the [Database Best Practices Guide](references/DATABASE.md).

## Security (Optional)

Spring Security is **optional** - only add it when you need authentication or authorization. See the [Security Guide](references/SECURITY.md) for JWT, OAuth2, role-based access, and CORS configuration.

## Testing

See the [Testing Guide](references/TEST.md) for unit tests (Mockito, `@WebMvcTest`), integration tests (TestContainers + `@ServiceConnection`), and Given-When-Then patterns with AssertJ.

## Front-End Development

Choose a front-end framework:

- **Vue.js 3** (default) 猸?鈫?[Vue.js Guide](references/VUE.md)
- **React 18** 鈫?[React Guide](references/REACT.md)
- **Angular 18** 鈫?[Angular Guide](references/ANGULAR.md)
- **Vanilla JavaScript** (no framework) 鈫?[Vanilla JS Guide](references/VANILLA-JS.md)

All options include: Vite/CLI dev server with hot reload, Bootstrap 5.3+, SPA routing, and automatic build into the Spring Boot JAR.

When wiring the `frontend-maven-plugin`, bind the Node install, `npm install`, and `npm run build` executions to the `generate-resources` phase. This makes `./mvnw spring-boot:run` build the frontend before Spring Boot starts, instead of only building it during explicit package-oriented commands.

> **Non-interactive scaffolding (important for CI and AI agents).** Two separate prompts must be silenced:
> 1. **npm's own "Ok to proceed?" install prompt** 鈥?silence by placing `-y` **before** the package name (flags after `--` go to the scaffolder, not to npm). Use `npm create -y vite@latest 鈥 or `npx --yes create-vite@latest 鈥.
> 2. **The scaffolder's own prompts** 鈥?create-vite 9.x and Angular CLI 22 still pose interactive questions (e.g. "Use rolldown-vite?", analytics opt-in) that `-y` / `--yes` do **not** silence. The reliable fix is to close stdin: pipe `echo |` into the command so the scaffolder immediately sees EOF and accepts defaults.
>
> Canonical recipes:
> - React / Vanilla: `echo | npx --yes create-vite@latest frontend --template react` (or `--template vanilla`)
> - Vue: `npm create -y vue@latest frontend -- --router --pinia --vitest --eslint --prettier` (create-vue does not pose extra prompts)
> - Angular: `echo | npx --yes @angular/cli@22 new frontend --style=css --ssr=false --skip-git --defaults --skip-install`, then `npm install`
>
> **Vue: normalize before the first `npm install` (required).** `create-vue` scaffolds `oxlint` and `eslint-plugin-oxlint` pinned to mismatched minors, so `npm install` fails with an `ERESOLVE` peer conflict 鈥?which fails the `frontend-maven-plugin` step and therefore the whole Maven build. Immediately after scaffolding, run:
>
> ```bash
> # Run from the Dr JSkill skill directory (that is where `scripts/` lives),
> # passing the path to the generated project's frontend/ directory.
> node scripts/normalize-vue-frontend.mjs /absolute/path/to/my-app/frontend
> ```
>
> It drops the oxlint dual-linter, leaving the single ESLint pipeline, and adds the `lint:check` script that `create-vue` never emits but the Maven `frontend-maven-plugin` build runs. It is idempotent, and `--check` reports without writing. See [Vue.js Guide](references/VUE.md#1-project-setup).
>
> **Vitest + callback Vite config.** If `vite.config.js` exports `defineConfig(({ mode }) => ...)`, do not let the generated `vitest.config.js` call `mergeConfig(viteConfig, ...)`. Resolve the callback first with `viteConfig({ mode: 'test', command: 'serve' })`; otherwise Vitest fails with `Cannot merge config in form of callback`. See [Vue.js Guide](references/VUE.md#2-configure-vite-for-spring-boot-integration).

## Docker Deployment

Spring Boot automatically manages Docker containers during development via `spring-boot-docker-compose`. For production, pick one of the four provided images: `Dockerfile` (JVM, jlink + distroless), `Dockerfile-aot` (JVM + Spring AOT), `Dockerfile-native` (GraalVM native), or `Dockerfile-crac` (CRaC fast-restore). See the [Docker Guide](references/DOCKER.md) for full setup, the matching Maven profiles, and deployment patterns.

## GraalVM Native Images

Build native images via Docker (no local GraalVM needed) or locally with `./mvnw -Pnative -DskipTests package native:compile`. See the [GraalVM Guide](references/GRAALVM.md) for configuration, runtime hints, testing, and CI/CD integration.

## Azure Deployment

Deploy to Azure Container Apps with an optional VNET-injected Azure Database for Azure Database for MySQL Flexible Server. Uses GitHub Container Registry (GHCR) for image storage (pushed via `GITHUB_TOKEN` in CI, pulled by Container Apps using a stored PAT) and Container Apps secrets for the DB password 鈥?no secrets in source, env dumps, or shell history. Includes a GitHub Actions OIDC workflow, and supports both the JVM and GraalVM native image variants. See the [Azure Deployment Guide](references/AZURE.md).

## Validation

| # | What | Command |
|---|------|---------|
| 1 | Build backend | `./mvnw clean install` |
| 2 | Unit tests | `./mvnw test` |
| 3 | Integration tests | `./mvnw verify` (uses Testcontainers 1 + `@ServiceConnection`) |
| 4 | Front-end dev server | `cd frontend && npm run dev` |

> Run validation steps first. If anything fails, fix before proceeding.

Once the project is generated, go through the steps above to ensure that the generated project is fully functional and follows best practices. If any validation step fails, try to identify the issue and fix it before proceeding. This ensures that the generated project is of high quality and ready for development.

## Additional Resources

### Included Reference Guides

**Core Spring Boot:**
- [Spring Boot 3 Migration Guide](references/SPRING-BOOT-3.md) - Key changes from Spring Boot 3, Jackson 3 annotations
- [Configuration Best Practices](references/CONFIGURATION.md) - Properties files, profiles, secrets management
- [Logging Best Practices](references/LOGGING.md) - Logback configuration and patterns
- [Java Code Intelligence (JDTLS)](references/JDTLS.md) - LSP-based navigation, refactoring, diagnostics

**Data and Persistence:**
- [Database Best Practices](references/DATABASE.md) - MySQL and Hibernate optimization

**Security (Optional):**
- [Security Guide](references/SECURITY.md) - Spring Security, JWT, OAuth2, authentication patterns

**Testing:**
- [Testing Guide](references/TEST.md) - Unit and integration testing with TestContainers

**Front-End Development:**
- [Vue.js Development Guide](references/VUE.md) - Vue.js 3 with Vite (default)
- [React Development Guide](references/REACT.md) - React 18 with Vite
- [Angular Development Guide](references/ANGULAR.md) - Angular 18 with Angular CLI
- [Vanilla JS Development Guide](references/VANILLA-JS.md) - Pure ES6+ with Vite

**Project Setup:**
- [Project Setup & Dotfiles](references/PROJECT-SETUP.md) - `.gitignore`, `.env.sample`, `.editorconfig`, `.gitattributes`, `.dockerignore`, `.devcontainer/`
- [Git Best Practices](references/GIT.md) - daily Git workflow, branches, commits, pull requests, safe undo, stashing, and worktrees

**Deployment:**
- [Docker Deployment Guide](references/DOCKER.md) - Docker, Docker Compose, development automation
- [GraalVM Native Images Guide](references/GRAALVM.md) - Docker-based native builds, optimization
- [Azure Deployment Guide](references/AZURE.md) - Azure Container Apps, Azure Database for MySQL Flexible Server, GitHub Container Registry (GHCR) image push/pull, Container Apps secrets for DB password, GitHub Actions OIDC
