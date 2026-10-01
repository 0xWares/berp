import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import {redis} from '@/lib/redis'

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks = {
    db: 'unknown' as 'ok' | 'fail' | 'unknown',
    redis: 'unknown' as 'ok' | 'fail' | 'unknown',
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.db = 'ok';
  } catch {
    checks.db = 'fail';
  }

  try {
    await redis.connect().catch(() => {});
    const pong = await redis.ping();
    checks.redis = pong === 'PONG' ? 'ok' : 'fail';
  } catch {
    checks.redis = 'fail';
  }

  const healthy = checks.db === 'ok' && checks.redis === 'ok';

  return NextResponse.json(
    { status: healthy ? 'ok' : 'degraded', ...checks, timestamp: new Date().toISOString() },
    { status: healthy ? 200 : 503 },
  );
}