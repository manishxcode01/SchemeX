import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import initSqlJs, { type Database } from 'sql.js'
import { DEFAULT_SCHEMES, EMPTY_PROFILE, checkEligibility, type Scheme, type UserProfile } from '../src/data/schemes.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDirectory = path.join(__dirname, 'data')
const databasePath = path.join(dataDirectory, 'schemex.sqlite')
const isProduction = process.env.NODE_ENV === 'production'
const localAuthEnabled = !isProduction || process.env.ALLOW_LOCAL_AUTH === 'true'
fs.mkdirSync(dataDirectory, { recursive: true })

const SQL = await initSqlJs({
  locateFile: file => path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', file),
})
const database: Database = fs.existsSync(databasePath)
  ? new SQL.Database(fs.readFileSync(databasePath))
  : new SQL.Database()

database.run(`
  CREATE TABLE IF NOT EXISTS schemes (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    published INTEGER NOT NULL DEFAULT 1,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    payload TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT NOT NULL
  );
`)

function persistDatabase() {
  fs.writeFileSync(databasePath, Buffer.from(database.export()))
}

const schemeCount = Number(database.exec('SELECT COUNT(*) FROM schemes')[0]?.values[0]?.[0] ?? 0)
if (schemeCount === 0) {
  const statement = database.prepare('INSERT INTO schemes (id, payload, published, updated_at) VALUES ($id, $payload, 1, $updatedAt)')
  for (const scheme of DEFAULT_SCHEMES) {
    statement.run({ '$id': scheme.id, '$payload': JSON.stringify(scheme), '$updatedAt': new Date().toISOString() })
  }
  statement.free()
}
persistDatabase()

const app = express()
app.disable('x-powered-by')
app.use((_request, response, next) => {
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.setHeader('Permissions-Policy', 'camera=(), geolocation=(), payment=()')
  next()
})
app.use(cors({ origin: process.env.CORS_ORIGIN?.split(',') || false }))
app.use(express.json())

function readSchemes() {
  const result = database.exec('SELECT payload FROM schemes WHERE published = 1 ORDER BY id')
  return (result[0]?.values ?? []).map(row => JSON.parse(String(row[0])))
}

function localUserId(request: express.Request) {
  return request.header('X-Local-User') || 'guest'
}

function readProfile(userId = 'guest'): UserProfile {
  const result = database.exec('SELECT payload FROM profiles WHERE id = ?', [userId])
  const payload = result[0]?.values[0]?.[0]
  return payload ? JSON.parse(String(payload)) as UserProfile : { ...EMPTY_PROFILE }
}

function upsertScheme(scheme: Scheme, published = true) {
  database.run(
    `INSERT INTO schemes (id, payload, published, updated_at) VALUES (?, ?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, published = excluded.published, updated_at = excluded.updated_at`,
    [scheme.id, JSON.stringify(scheme), published ? 1 : 0, new Date().toISOString()],
  )
  persistDatabase()
}

function requireLocalAuth(response: express.Response) {
  if (localAuthEnabled) return true
  response.status(403).json({ error: 'Local authentication is disabled in production. Configure Supabase for production accounts.' })
  return false
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  return `${salt}:${scryptSync(password, salt, 64).toString('hex')}`
}

function passwordMatches(password: string, stored: string) {
  const [salt, hash] = stored.split(':')
  if (!salt || !hash) return false
  const candidate = scryptSync(password, salt, 64)
  const saved = Buffer.from(hash, 'hex')
  return saved.length === candidate.length && timingSafeEqual(saved, candidate)
}

app.get('/api/health', (_request, response) => {
  response.json({ ok: true, service: 'schemex-api' })
})

app.get('/api/bootstrap', (_request, response) => {
  response.json({
    schemes: readSchemes(),
    profile: readProfile(localUserId(_request)),
  })
})

app.put('/api/profile', (request, response) => {
  if (!requireLocalAuth(response)) return
  const profile = { ...EMPTY_PROFILE, ...(request.body as Partial<UserProfile>) }
  const userId = localUserId(request)
  database.run(
    `INSERT INTO profiles (id, payload, updated_at) VALUES (?, ?, ?)
     ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at`,
    [userId, JSON.stringify(profile), new Date().toISOString()],
  )
  persistDatabase()
  response.json(profile)
})

app.get('/api/schemes', (_request, response) => {
  response.json(readSchemes())
})

app.get('/api/stats', (_request, response) => {
  const schemeTotal = Number(database.exec('SELECT COUNT(*) AS count FROM schemes WHERE published = 1')[0]?.values[0]?.[0] ?? 0)
  const userTotal = Number(database.exec('SELECT COUNT(*) AS count FROM users')[0]?.values[0]?.[0] ?? 0)
  const profile = readProfile(localUserId(_request))
  const matches = readSchemes().map(scheme => checkEligibility(scheme, profile))
  response.json({ users: userTotal, schemes: schemeTotal, eligibleMatches: matches.filter(match => match.status === 'ELIGIBLE').length, nearMissMatches: matches.filter(match => match.status === 'NEAR_MISS').length })
})

app.post('/api/auth/signup', (request, response) => {
  if (!requireLocalAuth(response)) return
  const { email, password, name } = request.body as { email?: string; password?: string; name?: string }
  if (!email || !password || !name || password.length < 6) return response.status(400).json({ error: 'Name, email, and a password of at least 6 characters are required.' })
  const id = `local:${email.trim().toLowerCase()}`
  const exists = database.exec('SELECT id FROM users WHERE email = ?', [email.trim().toLowerCase()])[0]?.values.length
  if (exists) return response.status(409).json({ error: 'An account with this email already exists. Please log in.' })
  database.run('INSERT INTO users (id, email, name, password, created_at) VALUES (?, ?, ?, ?, ?)', [id, email.trim().toLowerCase(), name.trim(), hashPassword(password), new Date().toISOString()])
  persistDatabase()
  response.status(201).json({ id, email: email.trim().toLowerCase(), name: name.trim() })
})

app.post('/api/auth/login', (request, response) => {
  if (!requireLocalAuth(response)) return
  const { email, password } = request.body as { email?: string; password?: string }
  const normalizedEmail = email?.trim().toLowerCase()
  if (!normalizedEmail || !password) return response.status(400).json({ error: 'Email and password are required.' })
  const statement = database.prepare('SELECT id, email, name, password FROM users WHERE email = ?')
  statement.bind([normalizedEmail])
  const user = statement.step() ? statement.getAsObject() as { id: string; email: string; name: string; password: string } : undefined
  statement.free()
  if (!user || !passwordMatches(password, user.password)) return response.status(401).json({ error: 'Invalid email or password.' })
  response.json({ id: user.id, email: user.email, name: user.name })
})

app.post('/api/schemes', (request, response) => {
  const scheme = request.body as Scheme
  if (!scheme?.id || !scheme?.name) return response.status(400).json({ error: 'A scheme id and name are required.' })
  upsertScheme(scheme)
  response.status(201).json(scheme)
})

app.put('/api/schemes/:id', (request, response) => {
  const current = database.exec('SELECT payload FROM schemes WHERE id = ?', [request.params.id])[0]?.values[0]?.[0]
  if (!current) return response.status(404).json({ error: 'Scheme not found' })
  const scheme = { ...(JSON.parse(String(current)) as Scheme), ...(request.body as Partial<Scheme>), id: request.params.id }
  upsertScheme(scheme)
  response.json(scheme)
})

app.post('/api/schemes/import', (request, response) => {
  const schemes = request.body as Scheme[]
  if (!Array.isArray(schemes)) return response.status(400).json({ error: 'Expected an array of schemes.' })
  schemes.forEach(scheme => upsertScheme(scheme))
  response.json({ imported: schemes.length })
})

app.delete('/api/schemes/:id', (request, response) => {
  database.run('UPDATE schemes SET published = 0, updated_at = ? WHERE id = ?', [new Date().toISOString(), request.params.id])
  persistDatabase()
  response.status(204).end()
})

app.get('/api/schemes/:id', (request, response) => {
  const statement = database.prepare('SELECT payload FROM schemes WHERE id = $id AND published = 1')
  statement.bind({ '$id': request.params.id })
  const row = statement.step() ? statement.getAsObject() as { payload: string } : undefined
  statement.free()

  if (!row) {
    response.status(404).json({ error: 'Scheme not found' })
    return
  }

  response.json(JSON.parse(row.payload))
})

const distDirectory = path.join(__dirname, '..', 'dist')
if (fs.existsSync(distDirectory)) {
  app.use(express.static(distDirectory))
  app.get(/.*/, (_request, response) => response.sendFile(path.join(distDirectory, 'index.html')))
}

const port = Number(process.env.PORT || process.env.API_PORT || 8787)
app.listen(port, () => {
  console.log(`SchemeX API listening on http://localhost:${port}`)
})
