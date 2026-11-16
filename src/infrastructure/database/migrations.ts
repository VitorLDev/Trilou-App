import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;

  if (currentVersion >= DATABASE_VERSION) {
    return;
  }

  if (currentVersion !== 0) {
    throw new Error(`Migração não disponível para a versão local ${currentVersion}.`);
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE cities (
      id INTEGER PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      state TEXT NOT NULL,
      country TEXT NOT NULL,
      timezone TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE lines (
      id INTEGER PRIMARY KEY NOT NULL,
      city_id INTEGER NOT NULL,
      external_id TEXT,
      name TEXT NOT NULL,
      color TEXT,
      transport_type TEXT NOT NULL CHECK (transport_type IN ('metro', 'vlt')),
      operational_status TEXT NOT NULL CHECK (operational_status IN ('active', 'planned', 'inactive')),
      FOREIGN KEY (city_id) REFERENCES cities(id)
    );

    CREATE TABLE stations (
      id INTEGER PRIMARY KEY NOT NULL,
      external_id TEXT,
      name TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      status TEXT NOT NULL DEFAULT 'active'
    );

    CREATE TABLE line_stations (
      id INTEGER PRIMARY KEY NOT NULL,
      line_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      sequence_order INTEGER NOT NULL,
      direction_id TEXT NOT NULL,
      is_active INTEGER NOT NULL DEFAULT 1,
      UNIQUE (line_id, direction_id, sequence_order),
      FOREIGN KEY (line_id) REFERENCES lines(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE route_patterns (
      id INTEGER PRIMARY KEY NOT NULL,
      line_id INTEGER NOT NULL,
      direction_id TEXT NOT NULL,
      shape_geometry TEXT,
      description TEXT,
      FOREIGN KEY (line_id) REFERENCES lines(id)
    );

    CREATE TABLE trips (
      id INTEGER PRIMARY KEY NOT NULL,
      external_id TEXT NOT NULL UNIQUE,
      route_id INTEGER NOT NULL,
      service_id TEXT NOT NULL,
      direction_id TEXT NOT NULL,
      shape_id TEXT,
      FOREIGN KEY (route_id) REFERENCES lines(id)
    );

    CREATE TABLE stop_times (
      id INTEGER PRIMARY KEY NOT NULL,
      trip_id INTEGER NOT NULL,
      station_id INTEGER NOT NULL,
      stop_sequence INTEGER NOT NULL,
      arrival_time TEXT,
      departure_time TEXT,
      UNIQUE (trip_id, stop_sequence),
      FOREIGN KEY (trip_id) REFERENCES trips(id),
      FOREIGN KEY (station_id) REFERENCES stations(id)
    );

    CREATE TABLE service_calendars (
      id INTEGER PRIMARY KEY NOT NULL,
      service_id TEXT NOT NULL UNIQUE,
      monday INTEGER NOT NULL DEFAULT 0,
      tuesday INTEGER NOT NULL DEFAULT 0,
      wednesday INTEGER NOT NULL DEFAULT 0,
      thursday INTEGER NOT NULL DEFAULT 0,
      friday INTEGER NOT NULL DEFAULT 0,
      saturday INTEGER NOT NULL DEFAULT 0,
      sunday INTEGER NOT NULL DEFAULT 0,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL
    );

    CREATE TABLE user_trips (
      id INTEGER PRIMARY KEY NOT NULL,
      local_user_id TEXT,
      line_id INTEGER NOT NULL,
      origin_station_id INTEGER NOT NULL,
      destination_station_id INTEGER NOT NULL,
      direction_id TEXT NOT NULL,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL CHECK (status IN ('active', 'completed', 'cancelled')),
      FOREIGN KEY (line_id) REFERENCES lines(id),
      FOREIGN KEY (origin_station_id) REFERENCES stations(id),
      FOREIGN KEY (destination_station_id) REFERENCES stations(id)
    );

    CREATE TABLE data_versions (
      id INTEGER PRIMARY KEY NOT NULL,
      source TEXT NOT NULL,
      version TEXT NOT NULL,
      imported_at TEXT NOT NULL,
      checksum TEXT NOT NULL,
      import_status TEXT NOT NULL CHECK (import_status IN ('pending', 'completed', 'failed'))
    );

    CREATE INDEX idx_lines_city ON lines(city_id);
    CREATE INDEX idx_line_stations_line ON line_stations(line_id, direction_id, sequence_order);
    CREATE INDEX idx_stops_trip ON stop_times(trip_id, stop_sequence);
    CREATE INDEX idx_user_trips_status ON user_trips(status, started_at DESC);

    PRAGMA user_version = ${DATABASE_VERSION};
  `);
}