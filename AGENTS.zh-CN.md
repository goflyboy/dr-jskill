# 这是一个遵循 Julien Dubois 最佳实践的 Spring Boot 技能

> 本文档是 [AGENTS.md](AGENTS.md) 的中文译版。如有歧义，以英文版为准。

- 你必须遵循 Agent Skills 规范：https://agentskills.io/home
- 编写脚本时，你必须使用 JavaScript（Node.js）脚本，并且要能在 macOS、Windows 和 Linux 上运行。
  - 脚本使用 ES modules（`.mjs` 扩展名），且只使用 Node.js 内置 API（不依赖任何 npm 包）。
  - 前置条件：Node.js 22.x 与 npm 10.x。
- 绝不要在生成的项目中建议使用 Lombok。`pom.xml` 中提供了一个可选的 `-Plombok` Maven profile，但默认关闭；应在生成的模板中加入 Maven Enforcer/ArchUnit 检查以防止误用。
- 构建工具**仅限 Maven**（不使用 Gradle）。
- **Hibernate ddl-auto** 是受支持的数据库初始化机制（`spring.jpa.hibernate.ddl-auto`）。不要提供 Liquibase 或 Flyway。
- 不要添加 OpenAPI/springdoc、功能开关（feature toggles）、Buildpacks 或 Jib。
- **必须随项目提供 dotfiles**：确保生成的项目包含 `.gitignore`、`.env.sample`、`.editorconfig`、`.gitattributes`、`.dockerignore`，以及可选的 `.vscode/`（参见 `references/PROJECT-SETUP.md`）。
- **`.env` 是本地密钥的唯一存放位置**：生成的项目从 `.env` 文件（已被 gitignore）加载真实凭据。始终指导用户将 `.env.sample` 复制为 `.env`，并在其中填写真实值。
- **绝不读取或暴露 `.env`**：`.env` 文件包含真实密钥。绝不要 `cat`、`view`、`read` 或打印其内容——不要输出到控制台、不要写入输出结果、不要写进日志。只有 `.env.sample`（占位值）可以被读取或展示。如果任务需要检查当前的环境变量值，请让用户只分享特定的变量名，绝不要分享整个文件。
- **Java 代码智能**：在生成的项目中处理 Java 文件时，**优先使用基于 JDTLS 的语言服务器工具**（goToDefinition、findReferences、hover、documentSymbol、rename），而不是 grep/view/sed。生成的项目会附带 `.cursor/rules/dr-jskill-java.mdc`（Cursor）与根目录 `AGENTS.md`（Codex）。参见 `references/JDTLS.md`。
- **不要通过 start.spring.io 生成项目。** Initializr 只提供当前的 Boot 版本线，对任何 3.x 请求都返回 HTTP 400。请改用 `scripts/lib/scaffold.mjs` 在本地生成，并从 Maven Central 的 `maven-metadata.xml` 解析 Boot 版本。
- **数据库**：运行时使用 MySQL，单元测试使用 H2（`test` scope）以实现免容器快速测试。表结构由 `spring.jpa.hibernate.ddl-auto` 管理。
- **仅使用 Jackson 2** —— 本技能面向 Spring Boot 3.x。`tools.jackson.*`（Jackson 3 / Boot 4）包不存在，绝不能生成。

## 版本清单（Versions Manifest）
所有版本集中维护在 `versions.json` 中。脚本通过 `scripts/lib/versions.mjs`（JavaScript）读取它。升级版本时请先修改该文件。

## 升级版本

**所有版本都存放在 `versions.json` 中——这是唯一的事实来源。**

### 版本升级流程

1. 编辑 `versions.json`，写入新的版本值。
2. 重新生成文档中的表格与资源版本信息：
   ```bash
   node scripts/sync-versions-in-docs.mjs
   ```
   该命令会更新：
   - `references/*.md` 中的版本表格（位于 `<!-- versions:start -->` / `<!-- versions:end -->` 之间）
   - 同一批文档中 `maven-frontend-plugin` 代码片段里的 `<nodeVersion>` / `<npmVersion>`
   - `assets/Dockerfile`、`assets/Dockerfile-native`、`assets/compose.yaml`、`assets/docker-compose*.yml`、`assets/devcontainer/*`、`assets/ci/github-actions.yml` 中硬编码的版本

   在 CI 中使用 `--check`，以便在任何内容不同步时让构建失败。
3. 清理同步脚本未覆盖到的剩余叙述性提及：
   - `references/**/*.md` 正文（例如版本标记之外的 "Node 22" / "MySQL 8.3"）
   - `SKILL.md`、`README.md`（前置条件、主要框架版本）
   - 工作坊章节（`workshop/*.md`），如果其中在正文中锁定了版本
4. 更新 `scripts/lib/versions.mjs` 中的兜底默认值（各个 `getXxx()` getter），以便在缺少 `versions.json` 时脚本仍能工作。
5. 通过生成一个项目并运行 `./mvnw verify` 做冒烟测试。

### 去哪里查看新版本

| 工具 | 来源 |
|------|--------|
| Java (Temurin) | https://adoptium.net/ |
| Spring Boot | https://spring.io/projects/spring-boot （从 Maven Central 的 `maven-metadata.xml` 解析） |
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

不要在这里新增 `Currently X.Y.Z` 之类的行——该文件中硬编码的版本号会与 `versions.json` 失去同步。请保持本指南不含具体版本号。
