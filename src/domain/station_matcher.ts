import type { MatchedTripState } from '@/domain/types';

interface Point {
  stationId: number;
  latitude: number;
  longitude: number;
}

export interface StationMatcherOptions {
  confirmedDistanceLimit: number;
  estimatedDistanceLimit: number;
  confidenceDistanceScale: number;
  temporaryStepLimit: number;
}

const defaultOptions: StationMatcherOptions = {
  confirmedDistanceLimit: 0.35,
  estimatedDistanceLimit: 1.5,
  confidenceDistanceScale: 1.2,
  temporaryStepLimit: 2,
};

export function distanceInKm(a: Point, b: Point): number {
  const earthRadius = 6371;
  const dLat = ((b.latitude - a.latitude) * Math.PI) / 180;
  const dLon = ((b.longitude - a.longitude) * Math.PI) / 180;
  const lat1 = (a.latitude * Math.PI) / 180;
  const lat2 = (b.latitude * Math.PI) / 180;
  const value = Math.sin(dLat / 2) ** 2 + Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

export class StationMatcher {
  private currentStationId: number | null = null;
  private previousDistance: number | null = null;
  private readonly options: StationMatcherOptions;

  constructor(options: Partial<StationMatcherOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
  }

  reset(): void {
    this.currentStationId = null;
    this.previousDistance = null;
  }

  observe(
    location: Point,
    stations: Point[],
    destinationStationId: number,
    accuracyKm?: number,
  ): MatchedTripState {
    if (stations.length === 0) {
      return this.undefinedState();
    }

    const ordered = [...stations].sort((a, b) => a.stationId - b.stationId);
    const ranked = ordered
      .map((station) => ({ station, distance: distanceInKm(location, station) }))
      .sort((a, b) => a.distance - b.distance);

    const closest = ranked[0];
    const locationLimit = accuracyKm
      ? Math.max(this.options.confirmedDistanceLimit, accuracyKm * 0.8)
      : this.options.confirmedDistanceLimit;

    const locationState =
      closest.distance <= locationLimit
        ? 'confirmed'
        : closest.distance <= this.options.estimatedDistanceLimit
          ? 'estimated'
          : 'undefined';

    const currentDistance = closest.distance;
    const isMovingForward =
      this.previousDistance !== null && currentDistance > this.previousDistance;

    if (
      locationState !== 'undefined' &&
      (this.currentStationId === null ||
        (closest.station.stationId !== this.currentStationId &&
          (locationState === 'confirmed' || isMovingForward)))
    ) {
      this.currentStationId = closest.station.stationId;
    }

    if (this.currentStationId === null) {
      return this.undefinedState();
    }

    this.previousDistance = currentDistance;

    const currentIndex = ordered.findIndex((station) => station.stationId === this.currentStationId);
    const destinationIndex = ordered.findIndex(
      (station) => station.stationId === destinationStationId,
    );

    if (currentIndex < 0 || destinationIndex < 0) {
      return this.undefinedState();
    }

    const next = ordered[currentIndex + 1] ?? null;

    return {
      currentStationId: this.currentStationId,
      nextStationId: next?.stationId ?? null,
      locationState,
      confidence: this.calculateConfidence(closest.distance, locationState, ordered.length),
      remainingStations: Math.max(0, destinationIndex - currentIndex),
      destinationReached: this.currentStationId === destinationStationId,
    };
  }

  private calculateConfidence(distance: number, state: 'confirmed' | 'estimated' | 'undefined', stationCount: number): number {
    const base = state === 'confirmed' ? 92 : state === 'estimated' ? 68 : 20;
    const distancePenalty = Math.min(
      80,
      Math.round((distance / this.options.confidenceDistanceScale) * 25),
    );
    const sequenceBonus = Math.min(8, Math.round(stationCount / 5));
    return Math.max(0, Math.min(100, base - distancePenalty + sequenceBonus));
  }

  private undefinedState(): MatchedTripState {
    return {
      currentStationId: this.currentStationId,
      nextStationId: null,
      locationState: 'undefined',
      confidence: 0,
      remainingStations: 0,
      destinationReached: false,
    };
  }
}