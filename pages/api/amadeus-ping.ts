import type { NextApiRequest, NextApiResponse } from 'next'
import { amadeus } from '@/lib/amadeus'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const id = process.env.AMADEUS_CLIENT_ID
    const secret = process.env.AMADEUS_CLIENT_SECRET
    const env = (process.env.AMADEUS_ENV || 'prod').toLowerCase()
    const host = env === 'test' ? 'test.api.amadeus.com' : 'api.amadeus.com'

    if (!id || !secret) {
      return res.status(200).json({ ok: false, stage: 'env', message: 'Brak AMADEUS_*', env, host })
    }

    // 1) RĘCZNIE pobierz token (daje najlepszy komunikat błędu)
    const tokenRsp = await fetch(`https://${host}/v1/security/oauth2/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: id,
        client_secret: secret,
      }),
    })

    const tokenText = await tokenRsp.text()
    let tokenJson: any = null
    try { tokenJson = JSON.parse(tokenText) } catch {}

    if (!tokenRsp.ok) {
      return res.status(200).json({
        ok: false,
        stage: 'oauth',
        status: tokenRsp.status,
        env, host,
        error: tokenJson || tokenText,
      })
    }

    // 2) Minimalne zapytanie SDK (powinno już przejść)
    const rsp = await amadeus.shopping.flightDestinations.get({
      origin: 'WAW',
      oneWay: true,
      currencyCode: 'PLN',
    } as any)

    const data = (rsp as any)?.data || []
    return res.status(200).json({
      ok: true,
      stage: 'api',
      env, host,
      count: Array.isArray(data) ? data.length : 0,
      sample: Array.isArray(data) ? data.slice(0, 2) : [],
    })
  } catch (err: any) {
    return res.status(200).json({
      ok: false,
      stage: 'api-error',
      message: err?.message || 'Unknown',
    })
  }
}
