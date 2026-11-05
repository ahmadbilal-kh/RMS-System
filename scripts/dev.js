import { spawn } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const projectRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)))
const windows = process.platform === 'win32'
const npmCommand = windows ? 'npm.cmd' : 'npm'
const tasks = [{ label: 'WEB', script: 'dev:web' }]
const hasServerEnv = existsSync(path.join(projectRoot, 'server', '.env'))
const explicitlyUsesApi = process.env.VITE_DEMO_MODE === 'false'
  || (existsSync(path.join(projectRoot, '.env'))
    && /^\s*VITE_DEMO_MODE\s*=\s*false\s*$/im.test(readFileSync(path.join(projectRoot, '.env'), 'utf8')))

if (hasServerEnv || explicitlyUsesApi) {
  tasks.push({ label: 'API', script: 'dev:api' })
} else {
  process.stdout.write('[API] Skipped: server/.env is missing. The frontend will run in local preview mode.\n')
}

process.stdout.write('Starting the project. Press Ctrl+C to stop all services.\n')

const children = []
let stopping = false
let exitStatus = 0
let closedCount = 0

function stopChild(child) {
  if (!child.pid || child.exitCode !== null || child.signalCode !== null) return
  if (windows) {
    const killer = spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], {
      stdio: 'ignore',
      windowsHide: true,
    })
    killer.on('error', () => child.kill())
  } else {
    child.kill('SIGTERM')
  }
}

function shutdown(code) {
  if (stopping) return
  stopping = true
  exitStatus = code
  children.forEach(stopChild)
  const forceExit = setTimeout(() => process.exit(exitStatus), 5000)
  forceExit.unref()
}

function pipeOutput(stream, label, target) {
  let remainder = ''
  stream.on('data', (chunk) => {
    const lines = (remainder + chunk.toString()).split(/\r?\n/)
    remainder = lines.pop() || ''
    for (const line of lines) target.write(`[${label}] ${line}\n`)
  })
  stream.on('end', () => {
    if (remainder) target.write(`[${label}] ${remainder}\n`)
  })
}

for (const task of tasks) {
  const child = spawn(npmCommand, ['run', task.script], {
    cwd: projectRoot,
    env: process.env,
    shell: windows,
    stdio: ['inherit', 'pipe', 'pipe'],
    windowsHide: true,
  })
  children.push(child)
  pipeOutput(child.stdout, task.label, process.stdout)
  pipeOutput(child.stderr, task.label, process.stderr)
  child.on('error', (error) => {
    process.stderr.write(`[${task.label}] Could not start: ${error.message}\n`)
    shutdown(1)
  })
  child.on('close', (code) => {
    closedCount += 1
    if (!stopping) shutdown(code ?? 1)
    if (stopping && closedCount === children.length) process.exit(exitStatus)
  })
}

process.on('SIGINT', () => shutdown(130))
process.on('SIGTERM', () => shutdown(143))
