// pages/api/routes/[id]/gpx.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  const { id } = req.query as { id: string };
  if (!id) return res.status(400).send('Missing id');

  const r = await prisma.route.findUnique({
    where: { id },
    select: { name: true, geojson: true },
  });

  if (!r?.geojson) return res.status(404).send('Route not found');

  const coords: [number, number][] = [];
  const g: any = r.geojson;

  const pushLine = (line: any[]) => {
    for (const pair of line) {
      const lon = Number(pair?.[0]);
      const lat = Number(pair?.[1]);
      if (Number.isFinite(lon) && Number.isFinite(lat)) coords.push([lon, lat]);
    }
  };

  if (g.type === 'FeatureCollection') {
    for (const f of g.features ?? []) {
      const gg = f?.geometry;
      if (!gg) continue;
      if (gg.type === 'LineString') pushLine(gg.coordinates ?? []);
      else if (gg.type === 'MultiLineString') for (const seg of gg.coordinates ?? []) pushLine(seg ?? []);
    }
  } else if (g.type === 'LineString') {
    pushLine(g.coordinates ?? []);
  } else if (g.type === 'MultiLineString') {
    for (const seg of g.coordinates ?? []) pushLine(seg ?? []);
  }

  if (!coords.length) return res.status(502).send('Empty geometry');

  const safeName = (r.name || id).replace(/[^\w\-]+/g, '_');
  const gpx = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<gpx version="1.1" creator="ZwiedzajChytrze">`,
    `<trk><name>${r.name || id}</name><trkseg>`,
    ...coords.map(([lon, lat]) => `<trkpt lat="${lat}" lon="${lon}"></trkpt>`),
    `</trkseg></trk>`,
    `</gpx>`
  ].join('');

  res.setHeader('content-type', 'application/gpx+xml; charset=utf-8');
  res.setHeader('content-disposition', `attachment; filename="${safeName}.gpx"`);
  return res.status(200).send(gpx);
}
