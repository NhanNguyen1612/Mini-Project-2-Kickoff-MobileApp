const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { Readable } = require('node:stream');

test('booking API rejects a competing booking and handles retries safely', async () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vku-booking-test-'));
  process.env.VKU_BOOKINGS_FILE = path.join(tempDir, 'bookings.json');
  process.env.VKU_USERS_FILE = path.join(tempDir, 'users.json');
  fs.writeFileSync(process.env.VKU_BOOKINGS_FILE, '[]');
  const config = require('../metro.config');
  const middleware = config.server.enhanceMiddleware(() => {});

  const request = (method, url, body) => new Promise((resolve, reject) => {
    const req = Readable.from(body ? [JSON.stringify(body)] : []);
    req.method = method;
    req.url = url;
    let status = 200;
    const res = {
      setHeader() {},
      writeHead(code) { status = code; },
      end(value) {
        resolve({ status, body: value ? JSON.parse(value) : undefined });
      },
    };
    Promise.resolve(middleware(req, res, () => reject(new Error('Request bypassed API'))))
      .catch(reject);
  });

  try {
    const base = {
      room_id: 'r-101',
      booking_date: '2026-10-01',
      time_slot: '07:30 - 09:30',
      user_student_id: '22IT001',
      user_name: 'Student',
    };
    const [first, second] = await Promise.all([
      request('POST', '/api/bookings', { ...base, client_id: 'booking-a' }),
      request('POST', '/api/bookings', { ...base, client_id: 'booking-b' }),
    ]);
    assert.deepEqual([first.status, second.status].sort(), [201, 409]);
    assert.equal(JSON.parse(fs.readFileSync(process.env.VKU_BOOKINGS_FILE)).length, 1);

    const retry = await request('POST', '/api/bookings', {
      ...base,
      client_id: first.status === 201 ? 'booking-a' : 'booking-b',
    });
    assert.equal(retry.status, 200);
    assert.equal(retry.body.data.id, first.status === 201 ? 'booking-a' : 'booking-b');
    assert.equal((await request('DELETE', '/api/bookings/missing')).status, 404);
    assert.equal((await request('DELETE', `/api/bookings/${retry.body.data.id}`)).status, 200);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
    delete process.env.VKU_BOOKINGS_FILE;
    delete process.env.VKU_USERS_FILE;
  }
});
