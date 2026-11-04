import 'dotenv/config'
import express from 'express'
import session from 'express-session'
import * as oidc from 'openid-client'
import { createHash, randomUUID } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// สร้าง Express app และอ่านค่าตั้งค่าจาก environment (.env)
const app = express()
// ค่าพื้นฐานที่ปรับได้ผ่าน .env
const port = Number(process.env.PORT || 3001)
const appBaseUrl = process.env.APP_BASE_URL || 'http://localhost:5173'
const isProduction = process.env.NODE_ENV === 'production'
const mockAuthEnabled = process.env.ENABLE_MOCK_AUTH === 'true' && !isProduction
// subject ของบัญชี ThaID ที่อนุญาตให้เป็นผู้ดูแลระบบ
const adminSubjects = new Set((process.env.THAID_ADMIN_SUBJECTS || '').split(',').map((value) => value.trim()).filter(Boolean))
// ตำแหน่งเก็บข้อมูลคอร์สและไฟล์ภาพพื้นหลังบนเครื่อง backend
const backendDir = path.dirname(fileURLToPath(import.meta.url))
const dataDir = path.join(backendDir, 'data')
const templateDir = path.join(backendDir, 'uploads', 'certificates')
const coursesFile = path.join(dataDir, 'courses.json')

// ป้องกันไม่ให้ server เริ่มทำงาน หากไม่มี session secret ที่ปลอดภัยพอ
if (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32) {
  throw new Error('SESSION_SECRET must be set to a random value of at least 32 characters.')
}

// โค้ดตัวอย่างนี้ยังใช้ session store แบบชั่วคราว จึงบล็อกการรัน production ไว้ก่อน
if (isProduction) {
  throw new Error('Configure a persistent session store before running this starter in production.')
}

// middleware: อ่าน JSON, เปิดให้โหลดภาพพื้นหลัง และจัดการ session/cookie ของผู้ใช้
app.use(express.json({ limit: '12mb' }))
app.use('/api/certificate-templates', express.static(templateDir))
app.use(session({
  name: 'ecert.sid',
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    sameSite: 'lax',
    secure: false,
    maxAge: 8 * 60 * 60 * 1000,
  },
}))

let oidcConfigurationPromise

// ค้นหา metadata ของผู้ให้บริการ ThaID และสร้าง OIDC client configuration เพียงครั้งเดียว
function getOidcConfiguration() {
  const issuer = process.env.THAID_ISSUER
  const clientId = process.env.THAID_CLIENT_ID
  if (!issuer || !clientId) {
    const error = new Error('ThaID integration settings are not configured.')
    error.status = 503
    throw error
  }

  if (!oidcConfigurationPromise) {
    const clientSecret = process.env.THAID_CLIENT_SECRET
    const authMethod = process.env.THAID_CLIENT_AUTH_METHOD
    let clientAuthentication

    if (authMethod === 'client_secret_basic' && clientSecret) {
      clientAuthentication = oidc.ClientSecretBasic(clientSecret)
    } else if (authMethod === 'client_secret_post' && clientSecret) {
      clientAuthentication = oidc.ClientSecretPost(clientSecret)
    } else if (authMethod === 'none') {
      clientAuthentication = oidc.None()
    } else if (authMethod) {
      throw new Error('Set THAID_CLIENT_AUTH_METHOD to a supported method and provide its required credentials.')
    }

    const metadata = clientSecret ? { client_secret: clientSecret } : undefined
    oidcConfigurationPromise = oidc.discovery(
      new URL(issuer),
      clientId,
      metadata,
      clientAuthentication,
    )
    oidcConfigurationPromise.catch(() => {
      oidcConfigurationPromise = undefined
    })
  }

  return oidcConfigurationPromise
}

// ตรวจว่า backend ทำงานอยู่หรือไม่ ใช้สำหรับ health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// บอก frontend ว่าเปิดโหมด mock สำหรับทดสอบอยู่หรือไม่
app.get('/api/auth/mode', (_req, res) => {
  res.json({ mockEnabled: mockAuthEnabled })
})

// ส่งข้อมูลผู้ใช้จาก session ปัจจุบันกลับไปให้ frontend
app.get('/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ authenticated: false })
  res.json({ authenticated: true, user: req.session.user })
})

// middleware ป้องกัน API สำหรับผู้ดูแล: ต้องเข้าสู่ระบบและ role ต้องเป็น admin
function requireAdmin(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' })
  if (req.session.user.role !== 'admin') return res.status(403).json({ error: 'บัญชีนี้ไม่มีสิทธิ์จัดการคอร์ส' })
  next()
}

// อ่านข้อมูลคอร์สทั้งหมดจากไฟล์ JSON
async function readCourses() {
  return JSON.parse(await readFile(coursesFile, 'utf8'))
}

// API ให้ผู้ดูแลโหลดรายการคอร์สทั้งหมด
app.get('/api/admin/courses', requireAdmin, async (_req, res, next) => {
  try {
    res.json({ courses: await readCourses() })
  } catch (error) {
    next(error)
  }
})

// API สร้างคอร์สใหม่ ตรวจข้อมูล/รหัสซ้ำ บันทึกภาพพื้นหลัง และเพิ่มข้อมูลลงไฟล์ JSON
app.post('/api/admin/courses', requireAdmin, async (req, res, next) => {
  try {
    const title = String(req.body?.title || '').trim()
    const instructor = String(req.body?.instructor || '').trim()
    const startDate = String(req.body?.startDate || '')
    const endDate = String(req.body?.endDate || '')
    const code = String(req.body?.code || '').trim().toUpperCase()
    const templateDataUrl = String(req.body?.templateDataUrl || '')

    // ตรวจว่าข้อมูลที่จำเป็นครบและวันที่อยู่ในรูปแบบ YYYY-MM-DD
    if (!title || !instructor || !startDate || !code || !templateDataUrl) {
      return res.status(400).json({ error: 'กรุณากรอกข้อมูลคอร์สและเลือกรูปแบบใบประกาศ' })
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate))) {
      return res.status(400).json({ error: 'รูปแบบวันที่ไม่ถูกต้อง' })
    }

    // ตรวจว่ารหัสคอร์สยังไม่ถูกใช้ในคอร์สอื่น
    const courses = await readCourses()
    if (courses.some((course) => course.code.toUpperCase() === code)) {
      return res.status(409).json({ error: 'รหัสคอร์สนี้ถูกใช้แล้ว' })
    }

    // ตรวจชนิดและขนาดไฟล์ แล้วบันทึกภาพด้วยชื่อสุ่มเพื่อสร้าง URL สำหรับแสดงผล
    let templateUrl = null
    if (templateDataUrl) {
      const match = templateDataUrl.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$/)
      if (!match) return res.status(400).json({ error: 'รองรับรูปแบบ PNG, JPG หรือ WebP เท่านั้น' })
      const image = Buffer.from(match[2], 'base64')
      if (image.length > 8 * 1024 * 1024) return res.status(413).json({ error: 'รูปแบบใบประกาศต้องมีขนาดไม่เกิน 8 MB' })

      const extension = match[1] === 'jpeg' ? 'jpg' : match[1]
      const fileName = `${randomUUID()}.${extension}`
      await mkdir(templateDir, { recursive: true })
      await writeFile(path.join(templateDir, fileName), image, { flag: 'wx' })
      templateUrl = `/api/certificate-templates/${fileName}`
    }

    // เก็บข้อมูลคอร์สและ URL ของภาพ แล้วบันทึกกลับไปที่ courses.json
    const course = {
      id: randomUUID(),
      title,
      instructor,
      startDate,
      endDate: endDate || null,
      code,
      templateUrl,
      createdAt: new Date().toISOString(),
    }
    courses.push(course)
    await writeFile(coursesFile, `${JSON.stringify(courses, null, 2)}\n`, 'utf8')
    res.status(201).json({ course })
  } catch (error) {
    next(error)
  }
})

// เข้าสู่ระบบผู้เรียนจำลองสำหรับ development เท่านั้น
app.post('/api/auth/mock', async (req, res, next) => {
  try {
    if (!mockAuthEnabled) return res.status(404).json({ error: 'โหมดทดลองถูกปิดอยู่' })

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve())
    })
    req.session.user = {
      subject: 'mock-learner-001',
      name: 'ผู้เรียนตัวอย่าง',
      role: 'learner',
      demo: true,
    }
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve())
    })
    res.json({ authenticated: true })
  } catch (error) {
    next(error)
  }
})

// เข้าสู่ระบบผู้ดูแลจำลองสำหรับ development เท่านั้น
app.post('/api/auth/mock-admin', async (req, res, next) => {
  try {
    if (!mockAuthEnabled) return res.status(404).json({ error: 'โหมดทดลองถูกปิดอยู่' })
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve())
    })
    req.session.user = {
      subject: 'mock-admin-001',
      name: 'ผู้จัดคอร์สตัวอย่าง',
      role: 'admin',
      demo: true,
    }
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve())
    })
    res.json({ authenticated: true })
  } catch (error) {
    next(error)
  }
})

// เริ่มขั้นตอน ThaID OIDC: สร้าง PKCE/state/nonce แล้ว redirect ไปหน้าอนุญาตตัวตน
app.get('/api/auth/thaid', async (req, res, next) => {
  try {
    const config = await getOidcConfiguration()
    const codeVerifier = oidc.randomPKCECodeVerifier()
    const codeChallenge = await oidc.calculatePKCECodeChallenge(codeVerifier)
    const state = oidc.randomState()
    const nonce = oidc.randomNonce()
    const redirectUri = new URL('/api/auth/thaid/callback', appBaseUrl).href

    // เก็บรหัสคอร์สจาก QR ไว้ใน session เพื่อพากลับไปดาวน์โหลดหลัง ThaID สำเร็จ
    const courseCode = String(req.query.code || '').trim().toUpperCase()
    req.session.thaidChecks = { codeVerifier, state, nonce, courseCode }
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve())
    })

    const authorizationUrl = oidc.buildAuthorizationUrl(config, {
      redirect_uri: redirectUri,
      scope: process.env.THAID_SCOPES || 'openid profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    })

    res.redirect(authorizationUrl.href)
  } catch (error) {
    next(error)
  }
})

// รับผล callback จาก ThaID ตรวจ state/nonce แลก token แล้วสร้าง session ผู้ใช้
app.get('/api/auth/thaid/callback', async (req, res, next) => {
  try {
    const checks = req.session.thaidChecks
    if (!checks) {
      return res.status(400).send('ไม่พบคำขอยืนยันตัวตน กรุณาเริ่มเข้าสู่ระบบใหม่')
    }

    const config = await getOidcConfiguration()
    const callbackUrl = new URL(req.originalUrl, appBaseUrl)
    const tokens = await oidc.authorizationCodeGrant(config, callbackUrl, {
      expectedState: checks.state,
      expectedNonce: checks.nonce,
      pkceCodeVerifier: checks.codeVerifier,
    })
    // ใช้เฉพาะ claims ที่ได้จาก ID token หรือ UserInfo ที่ ThaID อนุญาต
    const claims = tokens.claims()
    const pendingCourseCode = checks.courseCode
    if (!claims?.sub) throw new Error('ThaID response did not contain a verified subject.')
    let profile = claims
    if (!profile.name && tokens.access_token) {
      try {
        profile = await oidc.fetchUserInfo(config, tokens.access_token, claims.sub)
      } catch {
        // The identity provider may return the approved name only in the ID token.
      }
    }
    const name = profile.name || [profile.given_name, profile.family_name].filter(Boolean).join(' ')
    if (!name) throw new Error('ThaID did not provide a name in the approved profile claims.')

    // กำหนดสิทธิ์ admin จาก subject ที่ตั้งค่าไว้ใน THAID_ADMIN_SUBJECTS
    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve())
    })
    req.session.user = {
      subject: claims.sub,
      name,
      role: adminSubjects.has(claims.sub) ? 'admin' : 'learner',
    }
    await new Promise((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve())
    })

    const destination = req.session.user.role === 'admin'
      ? '/admin/courses'
      : pendingCourseCode
        ? `/course-code?code=${encodeURIComponent(pendingCourseCode)}`
        : '/course-code'
    res.redirect(destination)
  } catch (error) {
    next(error)
  }
})

// ตรวจรหัสคอร์สของผู้เรียนและส่งข้อมูลที่ต้องใช้สร้างใบประกาศกลับไป
app.post('/api/course-codes/redeem', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อน' })

  const code = String(req.body?.code || '').trim().toUpperCase()
  readCourses().then((courses) => {
    const course = courses.find((item) => item.code.toUpperCase() === code)
    if (!course) return res.status(400).json({ error: 'ไม่พบรหัสคอร์สนี้' })

    // สร้างเลขอ้างอิงจากคอร์สและ subject เพื่อให้ผู้เรียนแต่ละคนได้เลขไม่ซ้ำ
    const issuedAt = course.endDate || course.startDate
    const learnerId = createHash('sha256')
      .update(`${course.id}:${req.session.user.subject}`)
      .digest('hex')
      .slice(0, 10)
      .toUpperCase()
    res.json({
      certificate: {
        recipient: req.session.user.name,
        courseName: course.title,
        instructor: course.instructor,
        courseDate: 
        course.endDate && course.endDate !== course.startDate
        ? `${course.startDate} - ${course.endDate}` : course.startDate,
        reference: `EC-${course.id.slice(0, 8).toUpperCase()}-${learnerId}`,
        templateUrl: course.templateUrl,
        demo: Boolean(req.session.user.demo),
      },
    })
  }).catch((error) => {
    console.error(error.message)
    res.status(500).json({ error: 'โหลดข้อมูลคอร์สไม่สำเร็จ' })
  })
})

// ลบ session ปัจจุบันและล้าง cookie ออกจาก browser
app.post('/api/auth/logout', (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error)
    res.clearCookie('ecert.sid', { httpOnly: true, sameSite: 'lax' })
    res.status(204).end()
  })
})

// error middleware กลาง แปลง error ที่เกิดใน route ให้เป็น JSON response
app.use((error, _req, res, _next) => {
  console.error(error.message)
  const status = error.status || 500
  res.status(status).json({
    error: status === 503 ? error.message : 'การยืนยันตัวตนไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
  })
})

// เริ่มรับ request ที่ port ตามค่า PORT (ค่าเริ่มต้น 3001)
app.listen(port, () => {
  console.log(`e-Certificate API listening on http://localhost:${port}`)
})
