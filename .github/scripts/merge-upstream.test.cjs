const assert = require('node:assert/strict')
const { execFileSync, spawnSync } = require('node:child_process')
const { mkdtempSync, writeFileSync, readFileSync, rmSync } = require('node:fs')
const { tmpdir } = require('node:os')
const path = require('node:path')
const { test } = require('node:test')

const script = path.join(__dirname, 'merge-upstream.sh')

const fixture = (t) => {
  const directory = mkdtempSync(path.join(tmpdir(), 'explorer-upstream-'))
  t.after(() => rmSync(directory, { recursive: true, force: true }))
  const upstream = path.join(directory, 'upstream')
  const fork = path.join(directory, 'fork')
  const output = path.join(directory, 'output')
  const git = (cwd, ...args) =>
    execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
  const commit = (cwd, file, content) => {
    writeFileSync(path.join(cwd, file), content)
    git(cwd, 'add', file)
    git(cwd, 'commit', '-m', `Update ${file}`)
  }
  const identify = (cwd) => {
    git(cwd, 'config', 'user.name', 'Test')
    git(cwd, 'config', 'user.email', 'test@example.com')
    git(cwd, 'config', 'commit.gpgsign', 'false')
  }

  execFileSync('git', ['init', '--initial-branch=master', upstream], { stdio: 'ignore' })
  identify(upstream)
  commit(upstream, 'explorer.txt', 'original\n')
  execFileSync('git', ['clone', upstream, fork], { stdio: 'ignore' })
  identify(fork)
  commit(fork, 'wallet-names.txt', 'custom wallet names\n')

  const merge = () => {
    writeFileSync(output, '')
    return spawnSync('bash', [script, upstream, 'master'], {
      cwd: fork,
      env: { ...process.env, GITHUB_OUTPUT: output },
      encoding: 'utf8'
    })
  }

  return { upstream, fork, output, git, commit, merge }
}

test('does nothing when upstream is already included and preserves fork commits', (t) => {
  const f = fixture(t)
  const before = f.git(f.fork, 'rev-parse', 'HEAD')
  assert.equal(f.merge().status, 0)
  assert.equal(f.git(f.fork, 'rev-parse', 'HEAD'), before)
  assert.equal(readFileSync(f.output, 'utf8'), 'changed=false\n')
})

test('merges new upstream code without losing wallet names and is idempotent', (t) => {
  const f = fixture(t)
  f.commit(f.upstream, 'explorer.txt', 'updated explorer\n')
  assert.equal(f.merge().status, 0)
  assert.equal(readFileSync(path.join(f.fork, 'explorer.txt'), 'utf8'), 'updated explorer\n')
  assert.equal(readFileSync(path.join(f.fork, 'wallet-names.txt'), 'utf8'), 'custom wallet names\n')
  assert.match(readFileSync(f.output, 'utf8'), /^changed=true\nupstream_sha=[0-9a-f]{40}\n$/)
  assert.equal(f.git(f.fork, 'rev-list', '--parents', '-n', '1', 'HEAD').split(' ').length, 3)
  assert.match(f.git(f.fork, 'log', '-1', '--format=%s'), /\[skip ci\]/)
  assert.equal(f.merge().status, 0)
  assert.equal(readFileSync(f.output, 'utf8'), 'changed=false\n')
})

test('aborts conflicts and restores the original fork without publishing', (t) => {
  const f = fixture(t)
  f.commit(f.fork, 'explorer.txt', 'custom explorer\n')
  f.commit(f.upstream, 'explorer.txt', 'upstream explorer\n')
  const before = f.git(f.fork, 'rev-parse', 'HEAD')
  assert.notEqual(f.merge().status, 0)
  assert.equal(f.git(f.fork, 'rev-parse', 'HEAD'), before)
  assert.equal(readFileSync(path.join(f.fork, 'explorer.txt'), 'utf8'), 'custom explorer\n')
  assert.equal(f.git(f.fork, 'status', '--porcelain'), '')
  assert.equal(readFileSync(f.output, 'utf8'), '')
})

test('refuses to merge over uncommitted changes', (t) => {
  const f = fixture(t)
  writeFileSync(path.join(f.fork, 'explorer.txt'), 'uncommitted\n')
  assert.notEqual(f.merge().status, 0)
  assert.equal(readFileSync(path.join(f.fork, 'explorer.txt'), 'utf8'), 'uncommitted\n')
})
