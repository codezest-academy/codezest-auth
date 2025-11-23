import request from 'supertest';
import app from './src/app';

async function testRegister() {
  const res = await request(app).post('/api/v1/auth/register').send({
    email: 'debug@example.com',
    password: 'Password123!',
    name: 'Debug User',
  });

  console.log('Status:', res.status);
  console.log('Body:', JSON.stringify(res.body, null, 2));
}

testRegister().catch(console.error);
