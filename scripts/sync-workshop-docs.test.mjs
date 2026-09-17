import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { headingAnchor, rewriteLinks } from './sync-workshop-docs.mjs';

const githubAnchor = 'docker-build-fails-downloading-nodenpm-ssl-peer-shut-down-incorrectly';
const vuepressAnchor = 'docker-build-fails-downloading-node-npm-ssl-peer-shut-down-incorrectly';
const target = 'appendix-b-troubleshooting.md';

test('distinguishes GitHub and VuePress fragments for the Docker troubleshooting heading', () => {
  const heading = 'Docker build fails downloading Node/npm: "SSL peer shut down incorrectly"';
  assert.equal(headingAnchor(heading), githubAnchor);
  assert.equal(headingAnchor(heading, true), vuepressAnchor);
  assert.notEqual(headingAnchor(heading, true), githubAnchor);
});

test('publishes the correct troubleshooting fragment without changing the repository link', () => {
  const source = readFileSync(new URL('../workshop/08-deployment.md', import.meta.url), 'utf8');
  const published = rewriteLinks(source);

  assert.ok(source.includes(`](${target}#${githubAnchor})`));
  assert.ok(published.includes(`](${target}#${vuepressAnchor})`));
  assert.ok(!published.includes(`](${target}#${githubAnchor})`));
  assert.equal(rewriteLinks(published), published);
});

test('preserves numeric fragments already normalized by the VuePress link renderer', () => {
  const link = '[Publish](02-getting-started.md#10-optional-publish-to-github)';
  assert.equal(rewriteLinks(link), link);
  assert.equal(headingAnchor('10. Optional: Publish to GitHub', true), '_10-optional-publish-to-github');
});

test('leaves external URLs, explicit fragments, and unanchored links unchanged', () => {
  for (const link of [
    `[External](https://example.com/${target}#${githubAnchor})`,
    `[External](//example.com/${target}#${githubAnchor})`,
    '[Section](#custom-id)',
    `[Custom](${target}#custom-id)`,
    `[Appendix](${target})`,
  ]) {
    assert.equal(rewriteLinks(link), link);
  }
});

test('preserves off-site GitHub fragments and leaves invalid local links for --check', () => {
  const reference = '[Reference](../references/VUE.md#6-performance)';
  assert.equal(
    rewriteLinks(reference),
    '[Reference](https://github.com/jdubois/dr-jskill/blob/main/references/VUE.md#6-performance)',
  );
  for (const link of ['[Missing](missing-chapter.md#missing)', `[Unknown](${target}#unknown)`]) {
    assert.equal(rewriteLinks(link), link);
  }
});
