# This is a Spring Boot skill that follows Julien Dubois' best practices

- You MUST follow the Agents Skills specifications at: https://agentskills.io/home
- When doing a script, you MUST do a JavaScript (Node.js) script that works on Mac OS X, Windows and Linux.
  - Scripts use ES modules (`.mjs` extension) and only Node.js built-in APIs (no npm dependencies).
  - Node.js 22.x and npm 10.x are prerequisites.
- NEVER propose to use Lombok in the generated projects. An opt-in `-Plombok` Maven profile ships in `pom.xml`, but it is off by default; add Maven Enforcer/ArchUnit checks in generated templates to catch accidental use.
- Build tool is **Maven only** (no Gradle).
- **Hibernate ddl-auto** is the supported database initialization mechanism (`spring.jpa.hibernate.ddl-auto`). Do not offer Liquibase or Flyway.
- Do not add OpenAPI/springdoc, feature toggles, Buildpacks, or Jib.
- **Ship dotfiles**: ensure `.gitignore`, `.env.sample`, `.editorconfig`, `.gitattributes`, `.dockerignore`, optional `.vscode/` are added to generated projects (see `references/PROJECT-SETUP.md`).
- **`.env` is the canonical local secret store**: generated projects load real credentials from a `.env` file (gitignored). Always instruct users to copy `.env.sample` → `.env` and fill in real values there.
- **NEVER read or expose `.env`**: the `.env` file contains real secrets. Never `cat`, `view`, `read`, or print its contents — not to the console, not in output, not in logs. Only `.env.sample` (placeholder values) may be read or displayed. If a task requires inspecting current env values, ask the user to share only the specific variable name, never the whole file.
- **Java code intelligence**: when working on Java files in a generated project, **prefer the JDTLS-backed LSP tool** (goToDefinition, findReferences, hover, documentSymbol, rename) over grep/view/sed. Generated projects ship `.cursor/rules/dr-jskill-java.mdc` (Cursor) and a root `AGENTS.md` (Codex); see `references/JDTLS.md`.
- **Do not generate projects from start.spring.io.** The Initializr only serves the current Boot line and returns HTTP 400 for every 3.x request. Generate locally via `scripts/lib/scaffold.mjs`, resolving the Boot version from Maven Central's `maven-metadata.xml`.
- **Database**: MySQL at runtime, H2 (`test` scope) for fast container-free unit tests. Schema is managed by `spring.jpa.hibernate.ddl-auto`.
- **Jackson 2 only** — this skill targets Spring Boot 3.x. `tools.jackson.*` packages (Jackson 3, Boot 4) do not exist and must never be generated.

## Versions Manifest
Centralize versions in `versions.json`. Scripts load from `scripts/lib/versions.mjs` (JavaScript). Update this file first when bumping versions.

## Updating Versions

**All versions live in `versions.json` — the single source of truth.**

### Bump workflow

1. Edit `versions.json` with the new value(s).
2. Regenerate tables and asset versions:
   ```bash
   node scripts/sync-versions-in-docs.mjs
   ```
   This updates:
   - Version tables in `references/*.md` (between `<!-- versions:start -->` / `<!-- versions:end -->`)
   - `<nodeVersion>` / `<npmVersion>` inside `maven-frontend-plugin` snippets in the same docs
   - Hardcoded versions in `assets/Dockerfile`, `assets/Dockerfile-native`, `assets/compose.yaml`, `assets/docker-compose*.yml`, `assets/devcontainer/*`, `assets/ci/github-actions.yml`

   Use `--check` in CI to fail builds if anything is out of sync.
3. Sweep any remaining narrative mentions the sync script does not cover:
   - `references/**/*.md` prose (e.g. "Node 22" / "MySQL 8.3" outside version markers)
   - `SKILL.md`, `README.md` (prerequisites, headline framework versions)
   - Workshop chapters (`workshop/*.md`) if they pin a version in prose
4. Update fallback defaults in `scripts/lib/versions.mjs` (the `getXxx()` getters) so the scripts still work without `versions.json`.
5. Smoke-test by generating a project and running `./mvnw verify`.

### Where to check for new releases

| Tool | Source |
|------|--------|
| Java (Temurin) | https://adoptium.net/ |
| Spring Boot | https://spring.io/projects/spring-boot (resolved from Maven Central's `maven-metadata.xml`) |
| MySQL | https://www.mysql.org/ |
| GraalVM | https://www.graalvm.org/ |
| Maven | https://maven.apache.org/ |
| Node.js (LTS) | https://nodejs.org/en/about/previous-releases |
| npm | https://www.npmjs.com/package/npm |
| Vite | https://vitejs.dev/ |
| Vue.js / Pinia / Vue Router | https://vuejs.org/ |
| React / React Router | https://react.dev/ |
| Angular / Angular Router | https://angular.dev/ |
| Bootstrap | https://getbootstrap.com/ |
| Testcontainers | https://testcontainers.com/ |
| Spring Framework / Hibernate | https://spring.io/ / https://hibernate.org/ |
| Maven Frontend Plugin | https://github.com/eirslett/frontend-maven-plugin/releases |

Do **not** add new `Currently X.Y.Z` lines here — hardcoded version numbers in this file drift out of sync with `versions.json`. Keep this guide version-free.
