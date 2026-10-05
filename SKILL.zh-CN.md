---
name: dr-jskill
description: "创建 Java + Spring Boot 项目：Web 应用、基于 Vue.js / Angular / React / 原生 JS 的全栈应用、MySQL、REST API 以及 Docker。适用于创建 Spring Boot 项目、搭建 Java 微服务，或使用 Spring Framework 构建企业应用。"
metadata:
  recommended_model: gpt-5.5
---

# 遵循 Julien Dubois 最佳实践的 Spring Boot 技能

> 本文档是 [SKILL.md](SKILL.md) 的中文译版。命令、文件路径、配置键与代码片段保持英文原样，以便可原样复制执行；如出现歧义，以英文版为准。

## 概览（Overview）

本 Agent Skill 帮助你按照 [Julien Dubois](https://www.julien-dubois.com) 的最佳实践创建 Spring Boot 项目。它提供了一系列工具和脚本，用于快速搭建 Spring Boot 应用。

> **项目是如何生成的。** 早期版本会从 [https://start.spring.io](https://start.spring.io) 下载 starter 压缩包。但 Initializr 现在只提供当前的 Spring Boot 版本线（4.x），并且对**任何 3.x 请求都返回 HTTP 400**，因此它无法生成 Boot 3 项目。所以现在改由 `scripts/lib/scaffold.mjs` 在本地生成：它负责编写 `pom.xml`（继承 `spring-boot-starter-parent`）与 `src/` 目录骨架，并从 Maven Central 安装 Maven wrapper。Spring Boot 版本从 **Maven Central 的 `maven-metadata.xml`** 解析，而非来自 Initializr。

**推荐模型：** Dr JSkill 在 **GPT-5.5** 下效果最佳。

## 版本管理

所有版本集中维护在 `versions.json` 中。所有脚本都通过 `scripts/lib/versions.mjs`（JavaScript）读取它。升级 Java、Spring Boot 兜底版本、MySQL、Node/npm、Testcontainers 等时请修改该文件。

## 前置条件

1. 已安装 Java 21
2. Node.js 22.x 与 NPM 10.x（用于前端开发）
3. 已安装并正在运行 Docker

## 能力

- 生成具有预定义配置的 Spring Boot 项目
- 支持多种 Spring Boot 版本与依赖
- 遵循项目结构与配置的最佳实践
- 针对常见使用场景的快速搭建脚本
- 支持容器化部署的 Docker 方案
- 多种前端框架选项：
  - **Vue.js 3**（默认）——渐进式框架，提供 Composition API
  - **React 18**——构建用户界面的主流库
  - **Angular 18**——功能完备的 TypeScript 框架
  - **原生 JavaScript**——不使用框架，纯 ES6+ 配合 Vite

## 使用方法

### 使用脚本

本技能在 `scripts/` 目录中包含跨平台的 JavaScript（Node.js）脚本，可用于创建预配置好的 Spring Boot 项目。它们可在 Linux、macOS 与 Windows 上运行。

**统一启动器（跨平台）：**

```bash
node scripts/create-project my-app com.myco my-app com.myco.myapp 21 fullstack --output-dir /absolute/path/to/user/workspace
```

**直接调用：**

```bash
node scripts/create-project-latest.mjs my-app com.myco my-app com.myco.myapp 21 fullstack --output-dir /absolute/path/to/user/workspace
```

支持的参数：

- `--boot-version <x.y.z>` / `-BootVersion`：覆盖 Spring Boot 版本
- `--project-type basic|web|fullstack` / `-ProjectType`
- `--output-dir <absolute-path>`：在该目录下创建生成的项目文件夹

**输出目录规则（对 Agent Skills 很重要）：** 内置脚本是从技能目录根部运行的。当用户要求创建应用时，请传入 `--output-dir`，并指定 agent 会话中用户的当前工作目录，这样生成的项目文件夹会位于用户的工作区，而不是 `dr-jskill` 技能文件夹内部。只有在运行 Dr JSkill 自身的测试时才可以省略 `--output-dir`——那时在技能检出目录内生成是有意为之。

> 提示：`create-project-latest` 脚本会从 Maven Central 解析**最新的稳定 3.x** 版本；当网络不可用时会回退到配置的 `springBootFallback`。如有需要可用 `--boot-version` 覆盖。

### 最新版本项目

使用 `create-project-latest.mjs` 脚本创建一个使用**最新 Spring Boot 3.x 版本**的项目（自动获取）：

```bash
node scripts/create-project-latest.mjs my-app com.mycompany my-app com.mycompany.myapp 21 web
```

可用的项目类型：

- `basic` —— 最小化的 Spring Boot 项目
- `web` —— 具备 REST API 能力的 Web 应用
- `fullstack` —— 包含数据库与安全功能的完整应用

### 基础 Spring Boot 项目

使用 `create-basic-project.mjs` 脚本创建一个仅含必要依赖的基础 Spring Boot 项目：

```bash
node scripts/create-basic-project.mjs
```

### Web 应用

使用 `create-web-project.mjs` 脚本创建一个带 Web 依赖的 Spring Boot Web 应用：

```bash
node scripts/create-web-project.mjs
```

### 全栈应用

使用 `create-fullstack-project.mjs` 脚本创建一个包含数据库、安全与 Web 依赖的完整 Spring Boot 应用：

```bash
node scripts/create-fullstack-project.mjs
```

## 最佳实践

在创建 Spring Boot 项目时：

1. 使用最新的 Spring Boot 3.x 版本 —— `create-project-latest.mjs` 会从 Maven Central 自动解析
2. **了解 Spring Boot 3 的关键注意事项**：参见 [Spring Boot 3 参考指南](references/SPRING-BOOT-3.md)，其中涵盖 Jackson 2 注解与 Testcontainers 配置
3. 引入 Spring Boot Actuator 以获得生产就绪的能力
4. 使用 Spring Data JPA 进行数据库访问
5. 数据库使用 MySQL —— 单元测试则使用 H2 内存库以提升速度，参见[数据库最佳实践](references/DATABASE.md)
6. 使用 properties 文件进行配置 —— 参见[配置最佳实践](references/CONFIGURATION.md)
7. 设置基础 dotfiles：`.gitignore`、`.env.sample`、`.editorconfig`、`.gitattributes`、`.dockerignore`，以及可选的 `.vscode/`、`.devcontainer/` —— 参见[项目搭建与 Dotfiles](references/PROJECT-SETUP.md)
   - `.env` 文件是本地密钥的标准存放位置；应指导用户将 `.env.sample` 复制为 `.env` 并填写真实值
   - **绝不读取或暴露 `.env`**：其中包含真实密钥 —— 不要 `cat`、`view` 或打印其内容；只有 `.env.sample`（占位值）可以被读取或展示
8. 遵循日常 Git 最佳实践：小分支、经审阅的 diff、安全的提交、拉取请求与 worktree —— 参见 [Git 最佳实践](references/GIT.md)
9. 使用 `spring-boot-docker-compose` 在开发期自动启动数据库 —— 参见 [Docker 指南](references/DOCKER.md)
10. 遵循 RESTful API 设计原则
11. 使用 Logback 配置合适的日志 —— 参见[日志最佳实践](references/LOGGING.md)
12. 使用 Maven 进行依赖管理
13. 引入 Spring Boot DevTools 以提升开发效率
14. 仅在确有需要时才添加 Spring Security —— 最佳实践参见 [Security 指南](references/SECURITY.md)
15. 配置 Docker 以支持容器化部署 —— 参见 [Docker 指南](references/DOCKER.md)
16. 启用 GraalVM 原生镜像支持以加快启动 —— 参见 [GraalVM 指南](references/GRAALVM.md)
17. **始终提供启动横幅（startup banner）**，在应用就绪时打印访问 URL —— 参见[启动横幅](references/SPRING-BOOT-3.md#startup-banner-required)
18. 用户必须在变更提交到 git 之前先行审阅。在初始化 Git 仓库或执行 git 命令之前，先征询用户意见。

## Java 代码智能（JDTLS）

生成的项目集成了 **Eclipse JDT Language Server（JDTLS）**，让 AI agent 能够以*语义化*方式（而非文本搜索）导航、重构与诊断 Java 代码。每个项目都会附带 `.cursor/rules/dr-jskill-java.mdc`（**Cursor**）与根目录的 `AGENTS.md`（**Codex**），两者承载相同的规则；此前的 `.github/lsp.json` 仅面向 GitHub Copilot CLI，现已移除。

**给 AI agent 的建议**：处理 Java 文件时，优先使用语言服务器工具而不是 `grep`/`view`/`sed`。它能理解 imports、泛型、继承与 Javadoc。

| 任务 | 使用 |
|------|-----|
| 查找类/方法的定义位置 | go to definition |
| 修改方法签名前查找调用方 | find references 或 incoming calls |
| 查询类型、参数、Javadoc | hover |
| 列出文件中的符号 | document symbols |
| 在项目中搜索类/方法 | workspace symbol |
| 跨文件安全重命名 | rename（绝不要用 sed） |
| 在执行 `./mvnw verify` 之前检查编译错误 | diagnostics |

**Java 相关工作的优先级顺序：语言服务器 → 带 `.java` glob 的 `grep` → 直接读文件。**

JDTLS 只需安装一次：`brew install jdtls`（其他平台参见 [JDTLS 指南](references/JDTLS.md)）。完整配置、常见坑与编辑器集成方式见 [references/JDTLS.md](references/JDTLS.md)。

## 项目结构

只有在能带来价值时才包含 service 层（例如复杂的业务逻辑）。对于简单的 CRUD 应用，controller 可以直接调用 repository。

生成的项目采用以下推荐结构：

```plaintext
my-spring-boot-app/
├── .gitignore                 # Java + 前端 + 密钥（参见 references/PROJECT-SETUP.md）
├── .env.sample                # 本地环境变量模板；.env 已被 gitignore
├── .editorconfig              # 跨 IDE 统一格式
├── .gitattributes             # 统一换行符，diff 更清晰
├── .dockerignore              # 精简 Docker 构建上下文
├── .vscode/                   # 可选的编辑器推荐配置
│   ├── extensions.json
│   └── settings.json
├── .devcontainer/             # 可选的 Dev Container（Java 21 + Node 22 + MySQL）
│   ├── devcontainer.json
│   └── docker-compose.yml
├── AGENTS.md                  # AI agent 规则（Codex）；Cursor 读取 .cursor/rules/*.mdc
├── .cursor/rules/             # AI agent 规则（Cursor）
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/example/app/
│   │   │       ├── Application.java
│   │   │       ├── config/
│   │   │       ├── controller/
│   │   │       ├── service/         # 仅在需要时包含
│   │   │       ├── repository/
│   │   │       └── domain/
│   │   └── resources/
│   │       ├── static/              # 前端 Web 资源（HTML、CSS、JS）
│   │       │   ├── index.html
│   │       │   ├── css/
│   │       │   │   └── styles.css
│   │       │   ├── js/
│   │       │   │   └── app.js
│   │       │   └── images/
│   │       └── application.properties
│   └── test/
│       └── java/
│           └── com/example/app/
│               ├── config/
│               ├── controller/
│               ├── service/         # 仅在需要时包含
│               ├── repository/
│               └── domain/
├── Dockerfile                   # JVM 镜像（jlink 运行时 + distroless）
├── Dockerfile-aot               # JVM + Spring AOT 镜像
├── Dockerfile-native            # GraalVM 原生镜像
├── Dockerfile-crac              # CRaC（快速恢复）镜像
├── checkpoint-and-run.sh        # CRaC 入口点辅助脚本
├── compose.yaml                 # 开发用数据库（spring-boot-docker-compose）
├── docker-compose.yml           # 完整技术栈 + MySQL（JVM）
├── docker-compose-aot.yml       # 完整技术栈 + MySQL（AOT）
├── docker-compose-native.yml    # 完整技术栈 + MySQL（native）
├── docker-compose-crac.yml      # CRaC 应用（无数据库）
├── pom.xml
└── README.md
```

## 依赖

生成的项目包含：Spring Web、Spring Data JPA、Spring Boot Actuator、DevTools、MySQL、H2（test scope）、Validation、Docker Compose 支持、包含 JUnit 5 的 Test Starter，以及 TestContainers。

## 配置

使用 `.properties` 文件（不要用 YAML），通过环境变量将密钥外置，并利用 `@ConfigurationProperties` 获得类型安全。profiles（多环境配置）以及常见模式参见[配置指南](references/CONFIGURATION.md)。

`.env` 文件是本地密钥的唯一存放位置 —— 绝不读取或打印它；只有 `.env.sample`（占位值）可以展示。

**数据库优化**参见[数据库最佳实践指南](references/DATABASE.md)。

## 安全（可选）

Spring Security 是**可选的** —— 仅在需要认证或授权时才添加。JWT、OAuth2、基于角色的访问控制以及 CORS 配置参见 [Security 指南](references/SECURITY.md)。

## 测试

单元测试（Mockito、`@WebMvcTest`）、集成测试（TestContainers + `@ServiceConnection`）以及 AssertJ 的 Given-When-Then 模式，参见[测试指南](references/TEST.md)。

## 前端开发

选择一种前端框架：

- **Vue.js 3**（默认） → [Vue.js 指南](references/VUE.md)
- **React 18** → [React 指南](references/REACT.md)
- **Angular 18** → [Angular 指南](references/ANGULAR.md)
- **原生 JavaScript**（无框架） → [原生 JS 指南](references/VANILLA-JS.md)

所有选项都包含：基于 Vite/CLI 的开发服务器与热重载、Bootstrap 5.3+、SPA 路由，以及自动构建进 Spring Boot JAR。

配置 `frontend-maven-plugin` 时，请把 Node 安装、`npm install` 与 `npm run build` 的执行绑定到 `generate-resources` 阶段。这样 `./mvnw spring-boot:run` 就会在 Spring Boot 启动之前先构建前端，而不是只在显式的、打包导向的命令中才构建。

> **非交互式脚手架（对 CI 和 AI agent 很重要）。** 必须静默两个独立的提示：
> 1. **npm 自身的 "Ok to proceed?" 安装提示** —— 把 `-y` 放在包名**之前**（`--` 之后的参数会传给脚手架，而不是 npm）。使用 `npm create -y vite@latest …` 或 `npx --yes create-vite@latest …`。
> 2. **脚手架自身的提示** —— create-vite 9.x 与 Angular CLI 18 仍会提出交互式问题（例如 "Use rolldown-vite?"、是否开启 analytics），而 `-y` / `--yes` **无法**静默它们。可靠的做法是关闭 stdin：把 `echo |` 管道给命令，让脚手架立即看到 EOF 并接受默认值。
>
> 标准做法：
> - React / 原生 JS：`echo | npx --yes create-vite@latest frontend --template react`（或 `--template vanilla`）
> - Vue：`npm create -y vue@latest frontend -- --router --pinia --vitest --eslint --prettier`（create-vue 不会提出额外提示）
> - Angular：`echo | npx --yes @angular/cli@18 new frontend --style=css --ssr=false --skip-git --defaults --skip-install`，然后执行 `npm install`
>
> **Vue：在第一次 `npm install` 之前必须先归一化。** `create-vue` 生成的 `oxlint` 与 `eslint-plugin-oxlint` 被锁定在不匹配的次版本上，因此 `npm install` 会因 `ERESOLVE` peer 冲突而失败 —— 这会导致 `frontend-maven-plugin` 步骤失败，进而导致整个 Maven 构建失败。脚手架生成后请立即运行：
>
> ```bash
> # 在 Dr JSkill 技能目录下运行（`scripts/` 就在该目录），
> # 传入生成项目的 frontend/ 目录路径。
> node scripts/normalize-vue-frontend.mjs /absolute/path/to/my-app/frontend
> ```
>
> 它会移除 oxlint 这套双 linter，只保留单一的 ESLint 流程，并添加 `create-vue` 从不生成、但 Maven `frontend-maven-plugin` 构建会执行的 `lint:check` 脚本。它是幂等的，`--check` 参数只报告而不写入。参见 [Vue.js 指南](references/VUE.md#1-project-setup)。
>
> **Vitest + 回调形式的 Vite 配置。** 如果 `vite.config.js` 导出的是 `defineConfig(({ mode }) => ...)`，不要让生成的 `vitest.config.js` 调用 `mergeConfig(viteConfig, ...)`。请先用 `viteConfig({ mode: 'test', command: 'serve' })` 把回调解析为对象；否则 Vitest 会以 `Cannot merge config in form of callback` 失败。参见 [Vue.js 指南](references/VUE.md#2-configure-vite-for-spring-boot-integration)。

## Docker 部署

在开发期，Spring Boot 通过 `spring-boot-docker-compose` 自动管理 Docker 容器。生产环境请从提供的四种镜像中选一种：`Dockerfile`（JVM，jlink + distroless）、`Dockerfile-aot`（JVM + Spring AOT）、`Dockerfile-native`（GraalVM 原生）或 `Dockerfile-crac`（CRaC 快速恢复）。完整配置、对应的 Maven profile 与部署模式参见 [Docker 指南](references/DOCKER.md)。

## GraalVM 原生镜像

通过 Docker 构建原生镜像（无需本地安装 GraalVM），或在本地执行 `./mvnw -Pnative -DskipTests package native:compile`。配置、运行时提示（runtime hints）、测试与 CI/CD 集成参见 [GraalVM 指南](references/GRAALVM.md)。

## Azure 部署

部署到 Azure Container Apps，并可选注入 VNET 的 Azure Database for MySQL Flexible Server。使用 GitHub Container Registry（GHCR）存储镜像（在 CI 中通过 `GITHUB_TOKEN` 推送，由 Container Apps 使用存储的 PAT 拉取），并使用 Container Apps 的 secret 存放数据库密码 —— 源码、环境变量转储或 shell 历史中都没有明文密钥。包含一个 GitHub Actions OIDC 工作流，并同时支持 JVM 与 GraalVM 原生镜像两种变体。参见 [Azure 部署指南](references/AZURE.md)。

## 验证

| # | 验证内容 | 命令 |
|---|------|---------|
| 1 | 构建后端 | `./mvnw clean install` |
| 2 | 单元测试 | `./mvnw test` |
| 3 | 集成测试 | `./mvnw verify`（使用 Testcontainers 1 + `@ServiceConnection`） |
| 4 | 前端开发服务器 | `cd frontend && npm run dev` |

> 请先执行验证步骤。如有任何失败，先修复再继续。

项目生成后，请逐步走完上述步骤，确保生成的项目功能完整并遵循最佳实践。如有任何验证步骤失败，请先尝试定位问题并在继续之前修复它。这可以确保生成的项目质量过硬、可直接进入开发。

## 附加资源

### 随附的参考指南

**Spring Boot 核心：**

- [Spring Boot 3 参考指南](references/SPRING-BOOT-3.md) —— Spring Boot 3.x 的关键变化、Jackson 2 注解
- [配置最佳实践](references/CONFIGURATION.md) —— properties 文件、profile、密钥管理
- [日志最佳实践](references/LOGGING.md) —— Logback 配置与模式
- [Java 代码智能（JDTLS）](references/JDTLS.md) —— 基于 LSP 的导航、重构、诊断

**数据与持久化：**

- [数据库最佳实践](references/DATABASE.md) —— MySQL 与 Hibernate 优化

**安全（可选）：**

- [Security 指南](references/SECURITY.md) —— Spring Security、JWT、OAuth2、认证模式

**测试：**

- [测试指南](references/TEST.md) —— 使用 TestContainers 进行单元测试与集成测试

**前端开发：**

- [Vue.js 开发指南](references/VUE.md) —— Vue.js 3 + Vite（默认）
- [React 开发指南](references/REACT.md) —— React 18 + Vite
- [Angular 开发指南](references/ANGULAR.md) —— Angular 18 + Angular CLI
- [原生 JS 开发指南](references/VANILLA-JS.md) —— 纯 ES6+ + Vite

**项目搭建：**

- [项目搭建与 Dotfiles](references/PROJECT-SETUP.md) —— `.gitignore`、`.env.sample`、`.editorconfig`、`.gitattributes`、`.dockerignore`、`.devcontainer/`
- [Git 最佳实践](references/GIT.md) —— 日常 Git 工作流、分支、提交、拉取请求、安全撤销、stash 与 worktree

**部署：**

- [Docker 部署指南](references/DOCKER.md) —— Docker、Docker Compose、开发期自动化
- [GraalVM 原生镜像指南](references/GRAALVM.md) —— 基于 Docker 的原生构建、优化
- [Azure 部署指南](references/AZURE.md) —— Azure Container Apps、Azure Database for MySQL Flexible Server、GitHub Container Registry（GHCR）镜像推送/拉取、用于数据库密码的 Container Apps secret、GitHub Actions OIDC
