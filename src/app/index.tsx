import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import {
  findActiveCity,
  findDirectionsForLine,
  findLinesByCity,
  findStationsByLineAndDirection,
} from '@/infrastructure/database/queries';
import type { LineStation, MatchedTripState, TransitLine } from '@/domain/types';
import {
  TripSimulator,
  type SimulationScenario,
  type TripSimulatorState,
} from '@/application/trip_simulator';

type ScreenName = 'home' | 'lines' | 'stations' | 'trip';

export default function HomeScreen() {
  return (
    <TripFlow />
  );
}

function TripFlow() {
  const db = useSQLiteContext();
  const [screen, setScreen] = useState<ScreenName>('home');
  const [cityName, setCityName] = useState('Fortaleza');
  const [lines, setLines] = useState<TransitLine[]>([]);
  const [selectedLine, setSelectedLine] = useState<TransitLine | null>(null);
  const [directionId, setDirectionId] = useState<'0' | '1' | null>(null);
  const [stations, setStations] = useState<LineStation[]>([]);
  const [destination, setDestination] = useState<LineStation | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tripState, setTripState] = useState<TripSimulatorState | null>(null);
  const [scenario, setScenario] = useState<SimulationScenario>('movement');
  const simulatorRef = useRef<TripSimulator | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const city = await findActiveCity(db, cityName);
        if (!city) {
          throw new Error('Fortaleza não está disponível na base local.');
        }
        const availableLines = await findLinesByCity(db, city.id);
        if (mounted) {
          setLines(availableLines);
          setLoading(false);
        }
      } catch (loadError) {
        if (mounted) {
          setError(loadError instanceof Error ? loadError.message : 'Falha ao carregar dados locais.');
          setLoading(false);
        }
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [cityName, db]);

  const filteredStations = useMemo(() => {
    const normalizedSearch = normalize(search);
    return stations.filter((station) =>
      normalizedSearch.length === 0 || normalize(station.stationName).includes(normalizedSearch),
    );
  }, [search, stations]);

  async function chooseLine(line: TransitLine) {
    setSelectedLine(line);
    setDestination(null);
    setStations([]);
    setError(null);
    setLoading(true);
    try {
      const directions = await findDirectionsForLine(db, line.id);
      const nextDirection = directions.includes('0') ? '0' : directions[0] ?? '0';
      setDirectionId(nextDirection);
      const lineStations = await findStationsByLineAndDirection(db, line.id, nextDirection);
      setStations(lineStations);
      setScreen('stations');
    } catch (lineError) {
      setError(lineError instanceof Error ? lineError.message : 'Não foi possível carregar as estações.');
    } finally {
      setLoading(false);
    }
  }

  async function changeDirection(nextDirection: '0' | '1') {
    if (!selectedLine) return;
    setDirectionId(nextDirection);
    setDestination(null);
    setError(null);
    setLoading(true);
    try {
      const lineStations = await findStationsByLineAndDirection(db, selectedLine.id, nextDirection);
      setStations(lineStations);
    } catch (directionError) {
      setError(directionError instanceof Error ? directionError.message : 'Não foi possível inverter o sentido.');
    } finally {
      setLoading(false);
    }
  }

  function chooseDestination(station: LineStation) {
    setDestination(station);
    setTripState(null);
    const orderedStations = stations
      .filter((item) => item.sequenceOrder <= station.sequenceOrder)
      .sort((a, b) => a.sequenceOrder - b.sequenceOrder);
    simulatorRef.current = new TripSimulator(orderedStations, station.stationId);
    setScreen('trip');
  }

  function startSimulation() {
    if (!simulatorRef.current || !destination) return;
    const nextState = simulatorRef.current.next(scenario);
    setTripState(nextState);
  }

  function resetSimulation() {
    simulatorRef.current?.reset();
    setTripState(null);
  }

  function renderHeader(title: string, subtitle: string) {
    return (
      <View style={styles.header}>
        <Pressable accessibilityRole="button" onPress={() => setScreen('home')} style={styles.backButton}>
          <Text style={styles.backText}>‹ início</Text>
        </Pressable>
        <Text style={styles.eyebrow}>{subtitle}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {screen === 'home' && (
          <View style={styles.page}>
            <Text style={styles.eyebrow}>MOBILIDADE URBANA</Text>
            <Text style={styles.heroTitle}>TRILOU</Text>
            <Text style={styles.heroSubtitle}>Escolha sua linha. Nós acompanhamos o trajeto.</Text>

            <View style={styles.cityCard}>
              <View>
                <Text style={styles.cardLabel}>CIDADE ATIVA</Text>
                <Text style={styles.cardTitle}>{cityName}</Text>
              </View>
              <Text style={styles.cityBadge}>CE</Text>
            </View>

            <Pressable accessibilityRole="button" style={styles.primaryButton} onPress={() => setScreen('lines')}>
              <Text style={styles.primaryButtonText}>Iniciar viagem</Text>
            </Pressable>

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Como funciona</Text>
              <Text style={styles.infoText}>Selecione uma linha e uma estação de destino. Durante a viagem, o app mostra a estação atual e a próxima parada.</Text>
            </View>
          </View>
        )}

        {screen === 'lines' && (
          <View style={styles.page}>
            {renderHeader('Selecione a linha', `${cityName} · METRÔ E VLT`)}
            {loading ? <LoadingCard /> : (
              <View style={styles.cardList}>
                {lines.map((line) => (
                  <Pressable key={line.id} accessibilityRole="button" style={styles.selectCard} onPress={() => void chooseLine(line)}>
                    <View style={[styles.lineColor, { backgroundColor: line.color }]} />
                    <View style={styles.selectCardText}>
                      <Text style={styles.selectTitle}>{line.name}</Text>
                      <Text style={styles.selectSubtitle}>{line.transportType === 'metro' ? 'Metrô' : 'VLT'} · Em operação</Text>
                    </View>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {error && <ErrorCard message={error} />}
          </View>
        )}

        {screen === 'stations' && selectedLine && (
          <View style={styles.page}>
            {renderHeader('Escolha o destino', selectedLine.name)}
            <View style={styles.directionRow}>
              <DirectionButton label="Sentido 0" active={directionId === '0'} onPress={() => void changeDirection('0')} />
              <DirectionButton label="Sentido 1" active={directionId === '1'} onPress={() => void changeDirection('1')} />
            </View>
            <TextInput
              accessibilityLabel="Buscar estação"
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar estação"
              placeholderTextColor="#789087"
              style={styles.searchInput}
            />
            {loading ? <LoadingCard /> : (
              <View style={styles.stationList}>
                {filteredStations.map((station) => (
                  <Pressable key={`${directionId}-${station.stationId}`} accessibilityRole="button" style={styles.stationCard} onPress={() => chooseDestination(station)}>
                    <View style={[styles.stationDot, { backgroundColor: selectedLine.color }]} />
                    <Text style={styles.stationName}>{station.stationName}</Text>
                    <Text style={styles.chevron}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {error && <ErrorCard message={error} />}
          </View>
        )}

        {screen === 'trip' && selectedLine && destination && (
          <View style={styles.page}>
            {renderHeader('Acompanhamento da viagem', selectedLine.name)}
            <View style={styles.tripCard}>
              <Text style={styles.cardLabel}>DESTINO</Text>
              <Text style={styles.tripDestination}>{destination.stationName}</Text>
              <Text style={styles.tripMeta}>
                {tripState
                  ? `Localização: ${locationLabel(tripState.locationState)} · Confiança: ${tripState.confidence}%`
                  : 'Toque em avançar para simular o deslocamento.'}
              </Text>
            </View>

            {tripState && (
              <View style={styles.statusGrid}>
                <View style={styles.statusCard}>
                  <Text style={styles.statusLabel}>ESTAÇÃO ATUAL</Text>
                  <Text style={styles.statusValue}>{stationName(stations, tripState.currentStationId)}</Text>
                </View>
                <View style={styles.statusCard}>
                  <Text style={styles.statusLabel}>PRÓXIMA</Text>
                  <Text style={styles.statusValue}>{stationName(stations, tripState.nextStationId)}</Text>
                </View>
                <View style={styles.statusCard}>
                  <Text style={styles.statusLabel}>RESTANTES</Text>
                  <Text style={styles.statusValue}>{tripState.remainingStations}</Text>
                </View>
              </View>
            )}

            {tripState?.alertSent && (
              <View style={styles.alertCard}>
                <Text style={styles.alertTitle}>Prepare-se para desembarcar</Text>
                <Text style={styles.alertText}>A próxima estação é o seu destino.</Text>
              </View>
            )}

            <View style={styles.simulatorCard}>
              <Text style={styles.sectionTitle}>Simulador de viagem</Text>
              <View style={styles.directionRow}>
                <DirectionButton label="Normal" active={scenario === 'movement'} onPress={() => setScenario('movement')} />
                <DirectionButton label="GPS fraco" active={scenario === 'weak-gps'} onPress={() => setScenario('weak-gps')} />
                <DirectionButton label="Túnel" active={scenario === 'tunnel'} onPress={() => setScenario('tunnel')} />
              </View>
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" style={[styles.primaryButton, styles.actionButton]} onPress={startSimulation}>
                  <Text style={styles.primaryButtonText}>Avançar estação</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={[styles.secondaryButton, styles.actionButton]} onPress={resetSimulation}>
                  <Text style={styles.secondaryButtonText}>Reiniciar</Text>
                </Pressable>
              </View>
            </View>

            <Text style={styles.disclaimer}>Simulação local para validar o algoritmo. GPS real, segundo plano e notificações nativas entram na próxima etapa.</Text>
          </View>
        )}
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function DirectionButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={[styles.directionButton, active && styles.directionButtonActive]}>
      <Text style={[styles.directionButtonText, active && styles.directionButtonTextActive]}>{label}</Text>
    </Pressable>
  );
}

function LoadingCard() {
  return <View style={styles.loadingCard}><Text style={styles.loadingText}>Carregando dados locais...</Text></View>;
}

function ErrorCard({ message }: { message: string }) {
  return <View style={styles.errorCard}><Text style={styles.errorText}>{message}</Text></View>;
}

function stationName(stations: LineStation[], stationId: number | null): string {
  if (stationId === null) return 'Não identificada';
  return stations.find((station) => station.stationId === stationId)?.stationName ?? 'Não identificada';
}

function locationLabel(state: MatchedTripState['locationState']): string {
  if (state === 'confirmed') return 'Confirmada';
  if (state === 'estimated') return 'Estimada';
  return 'Indefinida';
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F4F7F5',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingVertical: 30,
  },
  page: {
    flex: 1,
  },
  heroTitle: {
    color: '#102A2A',
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: -3,
  },
  heroSubtitle: {
    maxWidth: 310,
    marginTop: 12,
    color: '#49615A',
    fontSize: 18,
    lineHeight: 27,
  },
  eyebrow: {
    marginBottom: 10,
    color: '#087F5B',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 2,
  },
  cityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 38,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    padding: 22,
    shadowColor: '#163C34',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 2,
  },
  cardLabel: {
    color: '#087F5B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  cardTitle: {
    marginTop: 5,
    color: '#102A2A',
    fontSize: 26,
    fontWeight: '800',
  },
  cityBadge: {
    borderRadius: 16,
    backgroundColor: '#E8F5EF',
    color: '#087F5B',
    fontSize: 13,
    fontWeight: '800',
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  primaryButton: {
    minHeight: 58,
    marginTop: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    backgroundColor: '#087F5B',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '800',
  },
  infoCard: {
    marginTop: 22,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    padding: 18,
  },
  infoTitle: {
    color: '#102A2A',
    fontSize: 16,
    fontWeight: '800',
  },
  infoText: {
    marginTop: 8,
    color: '#49615A',
    fontSize: 14,
    lineHeight: 21,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    minHeight: 36,
    justifyContent: 'center',
    marginBottom: 18,
  },
  backText: {
    color: '#087F5B',
    fontSize: 14,
    fontWeight: '800',
  },
  headerTitle: {
    color: '#102A2A',
    fontSize: 30,
    fontWeight: '900',
    letterSpacing: -1,
  },
  cardList: {
    gap: 12,
  },
  selectCard: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    shadowColor: '#163C34',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 1,
  },
  lineColor: {
    width: 8,
    height: 38,
    borderRadius: 9,
    marginRight: 15,
  },
  selectCardText: {
    flex: 1,
  },
  selectTitle: {
    color: '#102A2A',
    fontSize: 17,
    fontWeight: '800',
  },
  selectSubtitle: {
    marginTop: 4,
    color: '#637A71',
    fontSize: 13,
  },
  chevron: {
    color: '#8AA098',
    fontSize: 24,
    fontWeight: '600',
  },
  directionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  directionButton: {
    flex: 1,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CFDED7',
    backgroundColor: '#FFFFFF',
  },
  directionButtonActive: {
    borderColor: '#087F5B',
    backgroundColor: '#E8F5EF',
  },
  directionButtonText: {
    color: '#49615A',
    fontWeight: '700',
  },
  directionButtonTextActive: {
    color: '#087F5B',
    fontWeight: '800',
  },
  searchInput: {
    minHeight: 48,
    marginBottom: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#CFDED7',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    color: '#102A2A',
  },
  stationList: {
    gap: 10,
  },
  stationCard: {
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
  },
  stationDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 14,
  },
  stationName: {
    flex: 1,
    color: '#102A2A',
    fontSize: 16,
    fontWeight: '700',
  },
  tripCard: {
    borderRadius: 26,
    backgroundColor: '#102A2A',
    padding: 24,
  },
  tripDestination: {
    marginTop: 8,
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '900',
  },
  progressTrack: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 7,
    marginTop: 24,
  },
  progressDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  tripMeta: {
    marginTop: 20,
    color: '#BFD4CC',
    fontSize: 14,
  },
  disclaimer: {
    marginTop: 18,
    color: '#637A71',
    fontSize: 13,
    lineHeight: 20,
  },
  loadingCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 22,
  },
  loadingText: {
    color: '#49615A',
  },
  errorCard: {
    marginTop: 14,
    borderRadius: 16,
    backgroundColor: '#FFF0F0',
    padding: 16,
  },
  errorText: {
    color: '#A61B1B',
    fontWeight: '700',
  },
  statusGrid: {
    marginTop: 14,
    gap: 10,
  },
  statusCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    padding: 16,
  },
  statusLabel: {
    color: '#087F5B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  statusValue: {
    marginTop: 6,
    color: '#102A2A',
    fontSize: 18,
    fontWeight: '800',
  },
  alertCard: {
    marginTop: 14,
    borderRadius: 20,
    backgroundColor: '#FFF4D6',
    borderWidth: 1,
    borderColor: '#F2C94C',
    padding: 18,
  },
  alertTitle: {
    color: '#7A4B00',
    fontSize: 17,
    fontWeight: '900',
  },
  alertText: {
    marginTop: 6,
    color: '#7A4B00',
    fontSize: 14,
  },
  simulatorCard: {
    marginTop: 18,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DCE8E2',
    padding: 18,
  },
  sectionTitle: {
    color: '#102A2A',
    fontSize: 16,
    fontWeight: '800',
  },
  actionRow: {
    marginTop: 16,
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
  },
  secondaryButton: {
    minHeight: 58,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#087F5B',
  },
  secondaryButtonText: {
    color: '#087F5B',
    fontSize: 16,
    fontWeight: '800',
  },
});