import type { SQLiteDatabase } from 'expo-sqlite';
import type { City, LineStation, Station, TransitLine } from '@/domain/types';

export interface CityRow {
  id: number;
  name: string;
  state: string;
  country: string;
  timezone: string;
  is_active: number;
}

export interface LineRow {
  id: number;
  city_id: number;
  external_id: string | null;
  name: string;
  color: string | null;
  transport_type: 'metro' | 'vlt';
  operational_status: 'active' | 'planned' | 'inactive';
}

export interface StationRow {
  id: number;
  external_id: string | null;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface LineStationRow {
  station_id: number;
  station_name: string;
  sequence_order: number;
  direction_id: '0' | '1';
  latitude: number;
  longitude: number;
}

export function mapCity(row: CityRow): City {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    country: row.country,
    timezone: row.timezone,
    isActive: row.is_active === 1,
  };
}

export function mapLine(row: LineRow): TransitLine {
  return {
    id: row.id,
    cityId: row.city_id,
    externalId: row.external_id ?? '',
    name: row.name,
    color: row.color ? `#${row.color}` : '#087F5B',
    transportType: row.transport_type,
    operationalStatus: row.operational_status,
  };
}

export function mapStation(row: StationRow): Station {
  return {
    id: row.id,
    externalId: row.external_id ?? '',
    name: row.name,
    latitude: row.latitude,
    longitude: row.longitude,
    status: row.status,
  };
}

export function mapLineStation(row: LineStationRow): LineStation {
  return {
    stationId: row.station_id,
    stationName: row.station_name,
    sequenceOrder: row.sequence_order,
    directionId: row.direction_id,
    latitude: row.latitude,
    longitude: row.longitude,
  };
}

export async function findActiveCity(db: SQLiteDatabase, name: string): Promise<CityRow | null> {
  return db.getFirstAsync<CityRow>(
    'SELECT id, name, state, country, timezone, is_active FROM cities WHERE name = ? AND is_active = 1 LIMIT 1',
    [name],
  );
}

export async function findLinesByCity(db: SQLiteDatabase, cityId: number): Promise<TransitLine[]> {
  const rows = await db.getAllAsync<LineRow>(
    `SELECT id, city_id, external_id, name, color, transport_type, operational_status
     FROM lines WHERE city_id = ? AND operational_status = 'active' ORDER BY name`,
    [cityId],
  );
  return rows.map(mapLine);
}

export async function findStationsByLineAndDirection(
  db: SQLiteDatabase,
  lineId: number,
  directionId: '0' | '1',
): Promise<LineStation[]> {
  const rows = await db.getAllAsync<LineStationRow>(
    `SELECT ls.station_id, s.name AS station_name, ls.sequence_order, ls.direction_id,
            s.latitude, s.longitude
     FROM line_stations ls
     JOIN stations s ON s.id = ls.station_id
     WHERE ls.line_id = ? AND ls.direction_id = ? AND ls.is_active = 1
     ORDER BY ls.sequence_order`,
    [lineId, directionId],
  );
  return rows.map(mapLineStation);
}

export async function findDirectionsForLine(db: SQLiteDatabase, lineId: number): Promise<('0' | '1')[]> {
  const rows = await db.getAllAsync<{ direction_id: '0' | '1' }>(
    'SELECT DISTINCT direction_id FROM line_stations WHERE line_id = ? ORDER BY direction_id',
    [lineId],
  );
  return rows.map((row) => row.direction_id);
}