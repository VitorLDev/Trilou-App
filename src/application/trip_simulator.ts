import { StationMatcher } from '@/domain/station_matcher';
import type { LineStation, MatchedTripState } from '@/domain/types';

export type SimulationScenario = 'movement' | 'weak-gps' | 'tunnel';

export interface TripSimulatorState extends MatchedTripState {
  alertSent: boolean;
  scenario: SimulationScenario;
}

export class TripSimulator {
  private index = 0;
  private readonly matcher = new StationMatcher();
  private alertSent = false;

  constructor(
    private readonly stations: LineStation[],
    private readonly destinationStationId: number,
  ) {}

  reset(): void {
    this.index = 0;
    this.alertSent = false;
    this.matcher.reset();
  }

  next(scenario: SimulationScenario = 'movement'): TripSimulatorState {
    const station = this.stations[Math.min(this.index, this.stations.length - 1)];
    if (!station) {
      throw new Error('A viagem não possui estações cadastradas.');
    }

    const location = {
      stationId: station.stationId,
      latitude: station.latitude,
      longitude: station.longitude,
    };

    const result = this.matcher.observe(
      location,
      this.stations.map((item) => ({
        stationId: item.stationId,
        latitude: item.latitude,
        longitude: item.longitude,
      })),
      this.destinationStationId,
      scenario === 'weak-gps' ? 2 : scenario === 'tunnel' ? undefined : 0.08,
    );

    if (
      !this.alertSent &&
      result.locationState !== 'undefined' &&
      result.nextStationId === this.destinationStationId &&
      result.confidence >= 70
    ) {
      this.alertSent = true;
    }

    this.index = Math.min(this.index + 1, this.stations.length - 1);

    return {
      ...result,
      alertSent: this.alertSent,
      scenario,
    };
  }
}