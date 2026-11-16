import type { SQLiteDatabase } from 'expo-sqlite';

const cities = [
  { id: 1, name: 'Fortaleza', state: 'CE', country: 'Brasil', timezone: 'America/Fortaleza' },
];

const lines = [
  { id: 1, cityId: 1, externalId: '1', name: 'Linha Sul', color: 'ED1C24', transportType: 'metro' },
  { id: 2, cityId: 1, externalId: '2', name: 'Linha Oeste', color: 'A6CE39', transportType: 'metro' },
  { id: 3, cityId: 1, externalId: '3', name: 'Linha Nordeste', color: '5B54A4', transportType: 'metro' },
  { id: 7, cityId: 1, externalId: '7', name: 'VLT Aeroporto', color: '5B54A4', transportType: 'vlt' },
];

const stations = [
  { externalId: '14', name: 'Padre Cícero', latitude: -3.7457007, longitude: -38.5458588 },
  { externalId: '3', name: 'Porangabussu', latitude: -3.7514799, longitude: -38.55165 },
  { externalId: '4', name: 'Couto Fernandes', latitude: -3.75734, longitude: -38.5575385 },
  { externalId: '20', name: 'Juscelino Kubitscheck', latitude: -3.7662377, longitude: -38.5600252 },
  { externalId: '5', name: 'Parangaba', latitude: -3.7757912, longitude: -38.5638658 },
  { externalId: '31', name: 'Parangaba - Nepomuceno', latitude: -3.775791, longitude: -38.563866 },
  { externalId: '29', name: 'Expedicionários', latitude: -3.7711449, longitude: -38.5431745 },
  { externalId: '30', name: 'Montese', latitude: -3.7734828, longitude: -38.5529358 },
  { externalId: '28', name: 'Vila União', latitude: -3.7695418, longitude: -38.5340665 },
  { externalId: '15', name: 'Manoel Sátiro', latitude: -3.7985321, longitude: -38.5749936 },
  { externalId: '7', name: 'Mondubim', latitude: -3.8074449, longitude: -38.5777348 },
  { externalId: '16', name: 'Conjunto Esperança', latitude: -3.8171006, longitude: -38.5857147 },
  { externalId: '17', name: 'Aracapé', latitude: -3.8267294, longitude: -38.5920417 },
  { externalId: '8', name: 'Alto Alegre', latitude: -3.839444, longitude: -38.6006885 },
  { externalId: '9', name: 'Raquel de Queiroz', latitude: -3.8510345, longitude: -38.6086573 },
  { externalId: '18', name: 'Virgílio Távora', latitude: -3.8674874, longitude: -38.6200306 },
  { externalId: '19', name: 'Maracanaú', latitude: -3.8779348, longitude: -38.6255586 },
  { externalId: '10', name: 'Jereissati', latitude: -3.8875204, longitude: -38.6268729 },
  { externalId: '11', name: 'Carlito Benevides', latitude: -3.8950133, longitude: -38.6204249 },
  { externalId: '36', name: 'Antônio Bezerra', latitude: -3.734697, longitude: -38.5916287 },
  { externalId: '38', name: 'Padre Andrade', latitude: -3.7299642, longitude: -38.58097 },
  { externalId: '34', name: 'Álvaro Weyne', latitude: -3.720413, longitude: -38.5652726 },
  { externalId: '33', name: 'Moura Brasil', latitude: -3.7192908, longitude: -38.5369844 },
  { externalId: '1', name: 'Chico da Silva', latitude: -3.7200757, longitude: -38.5353224 },
  { externalId: '2', name: 'Benfica', latitude: -3.7391232, longitude: -38.5396476 },
  { externalId: '12', name: 'José de Alencar', latitude: -3.7260303, longitude: -38.5324792 },
  { externalId: '13', name: 'São Benedito', latitude: -3.7317481, longitude: -38.5348996 },
  { externalId: '23', name: 'Papicu', latitude: -3.738701, longitude: -38.4865632 },
  { externalId: '24', name: 'Antônio Sales', latitude: -3.7485103, longitude: -38.4934887 },
  { externalId: '25', name: 'Pontes Vieira', latitude: -3.751961, longitude: -38.5001895 },
  { externalId: '26', name: 'São João do Tauape', latitude: -3.7608053, longitude: -38.5121059 },
  { externalId: '27', name: 'Borges de Melo', latitude: -3.761192, longitude: -38.5289998 },
  { externalId: '21', name: 'Iate', latitude: -3.7206244, longitude: -38.4770246 },
  { externalId: '22', name: 'Mucuripe', latitude: -3.7258758, longitude: -38.4802841 },
  { externalId: '65', name: 'Aeroporto', latitude: -3.780111, longitude: -38.541842 },
  { externalId: '66', name: 'Expedicionários - Aeroporto', latitude: -3.771941, longitude: -38.543699 },
];

const southForward = ['14', '3', '4', '20', '5', '15', '7', '16', '17', '8', '9', '18', '19'];
const southBackward = [...southForward].reverse();
const westForward = ['20', '36', '38', '34', '33'];
const westBackward = [...westForward].reverse();
const northeastForward = ['5', '27', '26', '25', '24', '23', '31', '29', '30', '22', '21'];
const northeastBackward = [...northeastForward].reverse();
const airport = ['66', '65'];

export async function seedOfficialFortalezaData(db: SQLiteDatabase): Promise<void> {
  await db.withTransactionAsync(async () => {
    for (const city of cities) {
      await db.runAsync(
        'INSERT OR IGNORE INTO cities (id, name, state, country, timezone, is_active) VALUES (?, ?, ?, ?, ?, 1)',
        [city.id, city.name, city.state, city.country, city.timezone],
      );
    }

    for (const line of lines) {
      await db.runAsync(
        `INSERT OR IGNORE INTO lines (id, city_id, external_id, name, color, transport_type, operational_status)
         VALUES (?, ?, ?, ?, ?, ?, 'active')`,
        [line.id, line.cityId, line.externalId, line.name, line.color, line.transportType],
      );
    }

    const stationIds = new Map<string, number>();
    for (let index = 0; index < stations.length; index += 1) {
      const station = stations[index];
      const id = index + 1;
      stationIds.set(station.externalId, id);
      await db.runAsync(
        'INSERT OR IGNORE INTO stations (id, external_id, name, latitude, longitude, status) VALUES (?, ?, ?, ?, ?, ?)',
        [id, station.externalId, station.name, station.latitude, station.longitude, 'active'],
      );
    }

    async function insertDirection(lineId: number, directionId: '0' | '1', order: string[]) {
      for (let index = 0; index < order.length; index += 1) {
        const stationId = stationIds.get(order[index]);
        if (!stationId) {
          throw new Error(`Estação não cadastrada: ${order[index]}`);
        }
        await db.runAsync(
          `INSERT OR IGNORE INTO line_stations (line_id, station_id, sequence_order, direction_id, is_active)
           VALUES (?, ?, ?, ?, 1)`,
          [lineId, stationId, index + 1, directionId],
        );
      }
    }

    await insertDirection(1, '0', southForward);
    await insertDirection(1, '1', southBackward);
    await insertDirection(2, '0', westForward);
    await insertDirection(2, '1', westBackward);
    await insertDirection(3, '0', northeastForward);
    await insertDirection(3, '1', northeastBackward);
    await insertDirection(7, '0', airport);
    await insertDirection(7, '1', airport);

    await db.runAsync(
      `INSERT OR IGNORE INTO data_versions (source, version, imported_at, checksum, import_status)
       VALUES (?, ?, ?, ?, 'completed')`,
      ['Metrofor GTFS + Fortaleza em Mapas', '2026-11-16-local', new Date().toISOString(), 'validated-local'],
    );
  });
}