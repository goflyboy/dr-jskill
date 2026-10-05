#!/usr/bin/env node
/**
 * Generate a Spring Boot project from scratch, without start.spring.io.
 *
 * The Initializr only serves the current Spring Boot line (4.x) and answers HTTP
 * 400 for every 3.x request, so a skill pinned to a 3.x line cannot use it as a
 * generator. This module writes the same layout locally: a `pom.xml` inheriting
 * from `spring-boot-starter-parent` (resolved from Maven Central) plus the
 * standard `src/main/java` and `src/main/resources` skeleton.
 *
 * The Maven wrapper is fetched from Maven Central's `maven-wrapper-distribution`
 * artifact, so `./mvnw` works on a machine with no Maven installed.
 */

import { copyFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { execFileSync } from 'node:child_process';
import { downloadFile, extractZip } from './versions.mjs';

const MAVEN_WRAPPER_VERSION = '3.3.2';
const WRAPPER_BASE = 'https://repo1.maven.org/maven2/org/apache/maven/wrapper/maven-wrapper-distribution';
// The wrapper only downloads the distribution named here, so it must be a real
// Apache Maven distribution. `maven-wrapper-distribution-*-bin.zip` ships the
// wrapper scripts only (no Maven), which makes mvnw fail with
// "Could not locate the Maven launcher JAR"; `apache-maven-*-bin.zip` is correct.
const MAVEN_DIST_VERSION = '3.9.9';
const MAVEN_DIST_URL = `https://repo1.maven.org/maven2/org/apache/maven/apache-maven/${MAVEN_DIST_VERSION}/apache-maven-${MAVEN_DIST_VERSION}-bin.zip`;

/** Map the skill's dependency shorthands onto Maven coordinates. */
const DEPENDENCIES = {
  web: ['org.springframework.boot', 'spring-boot-starter-web'],
  'data-jpa': ['org.springframework.boot', 'spring-boot-starter-data-jpa'],
  actuator: ['org.springframework.boot', 'spring-boot-starter-actuator'],
  validation: ['org.springframework.boot', 'spring-boot-starter-validation'],
  // There is no `spring-boot-starter-devtools` artifact in any Boot 3.x line;
  // the real coordinates are `org.springframework.boot:spring-boot-devtools`,
  // which the BOM does manage, so no explicit version is needed.
  devtools: ['org.springframework.boot', 'spring-boot-devtools', 'runtime'],
  security: ['org.springframework.boot', 'spring-boot-starter-security'],
  mysql: ['com.mysql', 'mysql-connector-j', 'runtime'],
  postgresql: ['org.postgresql', 'postgresql', 'runtime'],
  h2: ['com.h2database', 'h2', 'runtime'],
  // Maven has no `developmentOnly` scope (that is Gradle). `runtime` keeps
  // spring-boot-docker-compose out of the packaged jar, which is the intent.
  'docker-compose': ['org.springframework.boot', 'spring-boot-docker-compose', 'runtime'],
  testcontainers: ['org.springframework.boot', 'spring-boot-testcontainers', 'test'],
  'flyway-core': ['org.flywaydb', 'flyway-core'],
  lombok: ['org.projectlombok', 'lombok', 'provided', true],
};

/**
 * Shorthands that are not Maven coordinates. `native` used to ask start.spring.io
 * for GraalVM native support, which since Boot 3 is already part of the
 * spring-boot-starter-parent, so it is a no-op here.
 */
const NO_OP_DEPENDENCIES = new Set(['native']);

const t = (n) => '\t'.repeat(n);

function parseDependencies(input) {
  const requested = String(input || '')
    .split(',')
    .map((d) => d.trim())
    .filter(Boolean);
  const resolved = [];
  for (const name of requested) {
    if (NO_OP_DEPENDENCIES.has(name)) continue;
    const spec = DEPENDENCIES[name];
    if (!spec) {
      console.error(`  ⚠️  Unknown dependency "${name}" — skipping.`);
      continue;
    }
    const [groupId, artifactId, scope, optional] = spec;
    resolved.push({ groupId, artifactId, scope, optional: optional === true });
  }
  return resolved;
}

function renderPom({ groupId, artifactId, name, description, packageName, javaVersion, bootVersion, dependencies }) {
  const mainClass = `${packageName}.${toCamelCase(name)}Application`;

  const depBlocks = dependencies
    .map(({ groupId, artifactId: aid, scope, version, optional }) => {
      const lines = [
        `${t(2)}<dependency>`,
        `${t(3)}<groupId>${groupId}</groupId>`,
        `${t(3)}<artifactId>${aid}</artifactId>`,
      ];
      if (version) lines.push(`${t(3)}<version>${version}</version>`);
      if (scope) lines.push(`${t(3)}<scope>${scope}</scope>`);
      if (optional) lines.push(`${t(3)}<optional>true</optional>`);
      lines.push(`${t(2)}</dependency>`);
      return lines.join('\n');
    })
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
  <modelVersion>4.0.0</modelVersion>

  <parent>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-parent</artifactId>
    <version>${bootVersion}</version>
    <relativePath/>
  </parent>

  <groupId>${groupId}</groupId>
  <artifactId>${artifactId}</artifactId>
  <version>0.0.1-SNAPSHOT</version>
  <name>${name}</name>
  <description>${description}</description>

  <properties>
    <java.version>${javaVersion}</java.version>
    <maven.compiler.release>${javaVersion}</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.springframework.boot</groupId>
      <artifactId>spring-boot-starter-test</artifactId>
      <scope>test</scope>
    </dependency>
${depBlocks}
  </dependencies>

  <build>
    <plugins>
      <plugin>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-maven-plugin</artifactId>
        <configuration>
          <mainClass>${mainClass}</mainClass>
        </configuration>
      </plugin>
    </plugins>
  </build>
</project>
`;
}

/**
 * Convert a kebab-case or snake_case name to CamelCase.
 * e.g. "my-spring-app" → "MySpringApp"
 */
function toCamelCase(name) {
  return name
    .split(/[-_]+/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');
}

function writeFile(destPath, content) {
  mkdirSync(dirname(destPath), { recursive: true });
  writeFileSync(destPath, content, 'utf8');
}

/** Install ./mvnw, ./mvnw.cmd and .mvn/wrapper/* from Maven Central. */
async function installMavenWrapper(projectDir) {
  const mvnw = join(projectDir, 'mvnw');
  if (existsSync(mvnw)) return; // Already installed.

  const tmp = join(projectDir, '.mvn-wrapper-tmp.zip');
  await downloadFile(`${WRAPPER_BASE}/${MAVEN_WRAPPER_VERSION}/maven-wrapper-distribution-${MAVEN_WRAPPER_VERSION}-bin.zip`, tmp);

  // The distribution zip has a top-level folder; extract then flatten the pieces we need.
  const staging = join(projectDir, '.mvn-wrapper-tmp');
  extractZip(tmp, staging);
  unlinkSync(tmp);

  const root = findWrapperRoot(staging);
  const wrapperProps = `distributionUrl=${MAVEN_DIST_URL}\nwrapperVersion=${MAVEN_WRAPPER_VERSION}\n`;

  mkdirSync(join(projectDir, '.mvn', 'wrapper'), { recursive: true });
  writeFile(join(projectDir, '.mvn', 'wrapper', 'maven-wrapper.properties'), wrapperProps);

  copyIfPresent(join(root, 'mvnw'), mvnw);
  copyIfPresent(join(root, 'mvnw.cmd'), join(projectDir, 'mvnw.cmd'));
  // The launcher jar ships under .mvn/wrapper/ inside the distribution, not at
  // the root. Without it `mvnw` aborts with "Could not locate the Maven launcher JAR".
  copyIfPresent(join(root, '.mvn', 'wrapper', 'maven-wrapper.jar'), join(projectDir, '.mvn', 'wrapper', 'maven-wrapper.jar'));

  if (process.platform !== 'win32' && existsSync(mvnw)) {
    execFileSync('chmod', ['+x', mvnw]);
  }
  removeDir(staging);
}

function copyIfPresent(from, to) {
  try {
    copyFileSync(from, to);
  } catch (err) {
    console.error(`  ⚠️  Could not copy ${from}: ${err?.message || String(err)}`);
  }
}

function removeDir(dir) {
  try {
    execFileSync(process.platform === 'win32' ? 'cmd' : 'rm',
      process.platform === 'win32' ? ['/c', 'rmdir', '/s', '/q', dir] : ['-rf', dir],
      { stdio: 'ignore' });
  } catch {
    // Best effort — a leftover staging dir is harmless.
  }
}

function findWrapperRoot(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      const nested = join(dir, entry.name);
      if (existsSync(join(nested, 'mvnw')) || existsSync(join(nested, 'mvnw.cmd'))) return nested;
    }
  }
  // Some builds unzip flat (no top-level folder) — the staging dir is the root.
  return dir;
}

/** Java reserved words that cannot be used as a package or class-name segment. */
const JAVA_KEYWORDS = new Set([
  'abstract', 'assert', 'boolean', 'break', 'byte', 'case', 'catch', 'char', 'class',
  'const', 'continue', 'default', 'do', 'double', 'else', 'enum', 'extends', 'final',
  'finally', 'float', 'for', 'goto', 'if', 'implements', 'import', 'instanceof', 'int',
  'interface', 'long', 'native', 'new', 'package', 'private', 'protected', 'public',
  'return', 'short', 'static', 'strictfp', 'super', 'switch', 'synchronized', 'this',
  'throw', 'throws', 'transient', 'try', 'void', 'volatile', 'while', 'true', 'false',
  'null', 'record', 'var', 'yield', 'sealed', 'permits', 'non-sealed',
]);

/** Reject package/class segments that Java cannot compile. */
function assertValidJavaNames(packageName, name) {
  const segments = String(packageName || '').split('.').filter(Boolean);
  for (const segment of segments) {
    if (JAVA_KEYWORDS.has(segment.toLowerCase())) {
      throw new Error(
        `PACKAGE_NAME segment "${segment}" is a Java reserved word and cannot be compiled.\n` +
        `  Fix PACKAGE_NAME (e.g. "com.acme.myapp" instead of "com.acme.${segment}").`,
      );
    }
    if (!/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(segment)) {
      throw new Error(
        `PACKAGE_NAME segment "${segment}" is not a valid Java identifier.`,
      );
    }
  }
  const mainClassName = `${toCamelCase(name)}Application`;
  if (JAVA_KEYWORDS.has(mainClassName.toLowerCase())) {
    throw new Error(
      `PROJECT_NAME "${name}" produces the class "${mainClassName}", which is a Java reserved word.`,
    );
  }
}

/**
 * Create a Spring Boot project on disk. Returns the absolute project directory.
 */
export async function generateProject(params) {
  const {
    baseDir, groupId, artifactId, name, description, packageName,
    javaVersion, bootVersion, dependencies, outputDir,
  } = params;

  if (/[\\/]/.test(baseDir)) {
    throw new Error(
      `PROJECT_NAME must be a plain folder name, not a path (got "${baseDir}").\n` +
      `Use --output-dir to choose where the project folder is created, e.g.\n` +
      `  --output-dir ${dirname(baseDir)} ${baseDir.split(/[\\/]/).pop()}`,
    );
  }

  assertValidJavaNames(packageName, name);

  const targetRoot = resolve(outputDir || process.cwd());
  mkdirSync(targetRoot, { recursive: true });
  const projectDir = join(targetRoot, baseDir);

  if (existsSync(projectDir) && readdirSync(projectDir).length > 0) {
    throw new Error(`Target directory already exists and is not empty: ${projectDir}`);
  }
  mkdirSync(projectDir, { recursive: true });

  const packagePath = packageName.replace(/\./g, '/');
  const mainClassName = `${toCamelCase(name)}Application`;

  // pom.xml
  writeFile(
    join(projectDir, 'pom.xml'),
    renderPom({
      groupId, artifactId, name, description, packageName, javaVersion, bootVersion,
      dependencies: parseDependencies(dependencies),
    }),
  );

  // Main application class
  writeFile(
    join(projectDir, 'src', 'main', 'java', packagePath, `${mainClassName}.java`),
    `package ${packageName};

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class ${mainClassName} {

    public static void main(String[] args) {
        SpringApplication.run(${mainClassName}.class, args);
    }
}
`,
  );

  // Application entry point test
  writeFile(
    join(projectDir, 'src', 'test', 'java', packagePath, `${mainClassName}Tests.java`),
    `package ${packageName};

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class ${mainClassName}Tests {

    @Test
    void contextLoads() {
    }
}
`,
  );

  // Empty resources + test resources directories (Git needs a file to track them)
  writeFile(join(projectDir, 'src', 'main', 'resources', '.gitkeep'), '');
  writeFile(join(projectDir, 'src', 'test', 'resources', '.gitkeep'), '');

  // .gitignore so the project is ready to `git init` without extra noise
  writeFile(join(projectDir, '.gitignore'), 'target/\n.env\n');

  await installMavenWrapper(projectDir);

  console.log('  ✅ Project generated successfully.');
  return projectDir;
}
