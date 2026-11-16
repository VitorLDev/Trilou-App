export type TransportType = 'metro' | 'vlt';
export type LocationState = 'confirmed' | 'estimated' | 'undefined';
export type TravelDirection = '0' | '1';

export interface City {
  id: number;
  name: string;
  state: string;
  country: string;
  timezone: string;
  isActive: boolean;
}

export interface TransitLine {
  id: number;
  cityId: number;
  externalId: string;
  name: string;
  color: string;
  transportType: TransportType;
  operationalStatus: 'active' | 'planned' | 'inactive';
}

export interface Station {
  id: number;
  externalId: string;
  name: string;
  latitude: number;
  longitude: number;
  status: string;
}

export interface LineStation {
  stationId: number;
  stationName: string;
  sequenceOrder: number;
  directionId: TravelDirection;
  latitude: number;
  longitude: number;
}

export interface TripPlan {
  line: TransitLine;
  directionId: TravelDirection;
  destinationStationId: number;
  stations: LineStation[];
}

export interface MatchedTripState {
  currentStationId: number | null;
  nextStationId: number | null;
  locationState: LocationState;
  confidence: number;
  remainingStations: number;
  destinationReached: boolean;
}