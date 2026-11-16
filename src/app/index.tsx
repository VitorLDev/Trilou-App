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
import { readStoredThemeMode, storeThemeMode } from '@/infrastructure/storage/theme_storage';
import { palettes, type ThemeMode } from '@/theme/theme';
import type { LineStation, MatchedTripState, TransitLine } from '@/domain/types';
import {
  TripSimulator,
  type SimulationScenario,
  type TripSimulatorState,
} from '@/application/trip_simulator';

type ScreenName = 'home' | 'lines' | 'stations' | 'trip';

export default function HomeScreen() {
  return <TripFlow />;
}

function TripFlow() {
  const db = useSQLiteContext();
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => readStoredThemeMode());
  const colors = palettes[themeMode];
  const [screen, setScreen] = useState<ScreenName>('home');
  const [cityName] = useState('Fortaleza');
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
        if (!city) throw new Error('Fortaleza não está disponível na base local.');
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

  function toggleTheme() {
    const nextMode = themeMode === 'dark' ? 'light' : 'dark';
    setThemeMode(nextMode);
    storeThemeMode(nextMode);
  }

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
    setTripState(simulatorRef.current.next(scenario));
  }

  function resetSimulation() {
    simulatorRef.current?.reset();
    setTripState(null);
  }

  function goHome() {
    setScreen('home');
    setSelectedLine(null);
    setDestination(null);
    setStations([]);
    setTripState(null);
    setSearch('');
  }

  function renderHeader(title: string, subtitle: string) {
    return (
      <View style={styles.header}>
        <View style={styles.headerTopRow}>
          <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
          <Pressable accessibilityRole="button" onPress={goHome} style={styles.backButton} hitSlop={8}>
            <Text style={styles.backText}>início</Text>
          </Pressable>
        </View>
        <Text style={styles.eyebrow}>{subtitle}</Text>
        <Text style={styles.headerTitle}>{title}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
      >
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={[styles.brandMark, { backgroundColor: colors.accent }]}>
              <Text style={[styles.brandMarkText, { color: colors.mode === 'dark' ? '#07120F' : '#FFFFFF' }]}>T</Text>
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.ink }]}>TRILOU</Text>
              <Text style={[styles.brandCaption, { color: colors.muted }]}>urban mobility</Text>
            </View>
          </View>
          <ThemeToggle themeMode={themeMode} onToggle={toggleTheme} />
        </View>

        {screen === 'home' && (
          <View style={styles.page}>
            <View style={[styles.heroCard, { backgroundColor: colors.surface }]}>
              <View style={[styles.statusBadge, { backgroundColor: colors.accentSoft }]}>
                <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
                <Text style={[styles.statusBadgeText, { color: colors.accent }]}>SISTEMA LOCAL ONLINE</Text>
              </View>
              <Text style={[styles.heroEyebrow, { color: colors.accent }]}>SEU TRAJETO INTELIGENTE</Text>
              <Text style={[styles.heroTitle, { color: colors.ink }]}>A próxima estação.{'\n'}Sem perder o momento.</Text>
              <Text style={[styles.heroSubtitle, { color: colors.muted }]}>Acompanhe sua viagem com tecnologia local, baixa latência e alertas antes do desembarque.</Text>
              <Pressable accessibilityRole="button" style={[styles.primaryButton, { backgroundColor: colors.accent }]} onPress={() => setScreen('lines')}>
                <Text style={[styles.primaryButtonText, { color: colors.mode === 'dark' ? '#07120F' : '#FFFFFF' }]}>Iniciar viagem</Text>
              </Pressable>
            </View>

            <View style={styles.quickRow}>
              <View style={[styles.quickCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.quickLabel, { color: colors.accent }]}>CIDADE ATIVA</Text>
                <Text style={[styles.quickValue, { color: colors.ink }]}>{cityName}</Text>
                <Text style={[styles.quickHint, { color: colors.muted }]}>Fortaleza · Ceará</Text>
              </View>
              <View style={[styles.quickCard, { backgroundColor: colors.surface }]}>
                <Text style={[styles.quickLabel, { color: colors.accent }]}>REDE</Text>
                <Text style={[styles.quickValue, { color: colors.ink }]}>{`${lines.length || 4} linhas`}</Text>
                <Text style={[styles.quickHint, { color: colors.muted }]}>Metrô e VLT</Text>
              </View>
            </View>

            <View style={[styles.infoCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.infoTitle, { color: colors.ink }]}>Fluxo de viagem</Text>
              <View style={styles.steps}>
                <View style={[styles.step, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}><Text style={[styles.stepNumberText, { color: colors.accent }]}>01</Text></View>
                  <Text style={[styles.stepTitle, { color: colors.ink }]}>Selecione a linha</Text>
                </View>
                <View style={[styles.step, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}><Text style={[styles.stepNumberText, { color: colors.accent }]}>02</Text></View>
                  <Text style={[styles.stepTitle, { color: colors.ink }]}>Escolha o destino</Text>
                </View>
                <View style={[styles.step, { backgroundColor: colors.surfaceAlt }]}>
                  <View style={[styles.stepNumber, { backgroundColor: colors.accentSoft }]}><Text style={[styles.stepNumberText, { color: colors.accent }]}>03</Text></View>
                  <Text style={[styles.stepTitle, { color: colors.ink }]}>Receba o alerta certo</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {screen === 'lines' && (
          <View style={styles.page}>
            {renderHeader('Selecione a linha', `${cityName} · METRÔ E VLT`)}
            {loading ? <LoadingCard /> : (
              <View style={styles.cardList}>
                {lines.map((line) => (
                  <Pressable key={line.id} accessibilityRole="button" style={[styles.selectCard, { backgroundColor: colors.surface }]} onPress={() => void chooseLine(line)}>
                    <View style={[styles.lineColor, { backgroundColor: line.color }]} />
                    <View style={styles.selectCardText}>
                      <Text style={[styles.selectTitle, { color: colors.ink }]}>{line.name}</Text>
                      <Text style={[styles.selectSubtitle, { color: colors.muted }]}>{line.transportType === 'metro' ? 'Metrô' : 'VLT'} · Em operação</Text>
                    </View>
                    <Text style={[styles.chevron, { color: colors.accent }]}>›</Text>
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
              <Pressable accessibilityRole="button" onPress={() => void changeDirection('0')} style={[styles.directionButton, { backgroundColor: directionId === '0' ? colors.accentSoft : colors.surface, borderColor: directionId === '0' ? colors.accent : colors.border }]}>
                <Text style={[styles.directionButtonText, { color: directionId === '0' ? colors.accent : colors.muted }]}>Sentido 0</Text>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => void changeDirection('1')} style={[styles.directionButton, { backgroundColor: directionId === '1' ? colors.accentSoft : colors.surface, borderColor: directionId === '1' ? colors.accent : colors.border }]}>
                <Text style={[styles.directionButtonText, { color: directionId === '1' ? colors.accent : colors.muted }]}>Sentido 1</Text>
              </Pressable>
            </View>
            <TextInput
              accessibilityLabel="Buscar estação"
              value={search}
              onChangeText={setSearch}
              placeholder="Buscar estação"
              placeholderTextColor={colors.muted}
              style={[styles.searchInput, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.ink }]}
            />
            {loading ? <LoadingCard /> : (
              <View style={styles.stationList}>
                {filteredStations.map((station) => (
                  <Pressable key={`${directionId}-${station.stationId}`} accessibilityRole="button" style={[styles.stationCard, { backgroundColor: colors.surface }]} onPress={() => chooseDestination(station)}>
                    <View style={[styles.stationDot, { backgroundColor: selectedLine.color }]} />
                    <Text style={[styles.stationName, { color: colors.ink }]}>{station.stationName}</Text>
                    <Text style={[styles.chevron, { color: colors.accent }]}>›</Text>
                  </Pressable>
                ))}
              </View>
            )}
            {error && <ErrorCard message={error} />}
          </View>
        )}

        {screen === 'trip' && selectedLine && destination && (
          <View style={styles.page}>
            {renderHeader('Acompanhamento', selectedLine.name)}

            <View style={[styles.tripCard, { backgroundColor: colors.darkCard }]}>
              <View style={styles.tripCardTop}>
                <View>
                  <Text style={[styles.cardLabel, { color: colors.accent }]}>DESTINO</Text>
                  <Text style={[styles.tripDestination, { color: colors.darkCardInk }]}>{destination.stationName}</Text>
                </View>
                <View style={[styles.lineColor, { backgroundColor: selectedLine.color }]} />
              </View>
              <Text style={[styles.tripMeta, { color: colors.darkCardMuted }]}>
                {tripState
                  ? `Localização ${locationLabel(tripState.locationState)} · Confiança ${tripState.confidence}%`
                  : 'Toque em avançar para simular o deslocamento.'}
              </Text>
            </View>

            {tripState && (
              <View style={styles.statusGrid}>
                <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.statusMarker, { backgroundColor: selectedLine.color }]} />
                  <Text style={[styles.statusLabel, { color: colors.accent }]}>ESTAÇÃO ATUAL</Text>
                  <Text style={[styles.statusValue, { color: colors.ink }]}>{stationName(stations, tripState.currentStationId)}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.statusMarker, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.statusLabel, { color: colors.accent }]}>PRÓXIMA</Text>
                  <Text style={[styles.statusValue, { color: colors.ink }]}>{stationName(stations, tripState.nextStationId)}</Text>
                </View>
                <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
                  <View style={[styles.statusMarker, { backgroundColor: colors.accent }]} />
                  <Text style={[styles.statusLabel, { color: colors.accent }]}>RESTANTES</Text>
                  <Text style={[styles.statusValue, { color: colors.ink }]}>{tripState.remainingStations}</Text>
                </View>
              </View>
            )}

            {tripState?.alertSent && (
              <View style={[styles.alertCard, { backgroundColor: colors.warning }]}>
                <Text style={[styles.alertTitle, { color: colors.warningInk }]}>Prepare-se para desembarcar</Text>
                <Text style={[styles.alertText, { color: colors.warningInk }]}>A próxima estação é o seu destino.</Text>
              </View>
            )}

            <View style={[styles.simulatorCard, { backgroundColor: colors.surface }]}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>Simulador de viagem</Text>
              <View style={styles.directionRow}>
                <Pressable accessibilityRole="button" onPress={() => setScenario('movement')} style={[styles.directionButton, { backgroundColor: scenario === 'movement' ? colors.accentSoft : colors.surface, borderColor: scenario === 'movement' ? colors.accent : colors.border }]}>
                  <Text style={[styles.directionButtonText, { color: scenario === 'movement' ? colors.accent : colors.muted }]}>Normal</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setScenario('weak-gps')} style={[styles.directionButton, { backgroundColor: scenario === 'weak-gps' ? colors.accentSoft : colors.surface, borderColor: scenario === 'weak-gps' ? colors.accent : colors.border }]}>
                  <Text style={[styles.directionButtonText, { color: scenario === 'weak-gps' ? colors.accent : colors.muted }]}>GPS fraco</Text>
                </Pressable>
                <Pressable accessibilityRole="button" onPress={() => setScenario('tunnel')} style={[styles.directionButton, { backgroundColor: scenario === 'tunnel' ? colors.accentSoft : colors.surface, borderColor: scenario === 'tunnel' ? colors.accent : colors.border }]}>
                  <Text style={[styles.directionButtonText, { color: scenario === 'tunnel' ? colors.accent : colors.muted }]}>Túnel</Text>
                </Pressable>
              </View>
              <View style={styles.actionRow}>
                <Pressable accessibilityRole="button" style={[styles.primaryButton, styles.actionButton, { backgroundColor: colors.accent }]} onPress={startSimulation}>
                  <Text style={[styles.primaryButtonText, { color: colors.mode === 'dark' ? '#07120F' : '#FFFFFF' }]}>Avançar estação</Text>
                </Pressable>
                <Pressable accessibilityRole="button" style={[styles.secondaryButton, styles.actionButton, { borderColor: colors.accent }]} onPress={resetSimulation}>
                  <Text style={[styles.secondaryButtonText, { color: colors.accent }]}>Reiniciar</Text>
                </Pressable>
              </View>
            </View>

            <Text style={[styles.disclaimer, { color: colors.muted }]}>Simulação local para validar o algoritmo. GPS real, segundo plano e notificações nativas entram na próxima etapa.</Text>
          </View>
        )}
      </ScrollView>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
    </SafeAreaView>
  );
}

function ThemeToggle({ themeMode, onToggle }: { themeMode: ThemeMode; onToggle: () => void }) {
  const colors = palettes[themeMode];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={themeMode === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
      onPress={onToggle}
      style={[styles.themeToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}
      hitSlop={8}
    >
      <Text style={[styles.themeToggleText, { color: colors.ink }]}>
        {themeMode === 'dark' ? '☾ escuro' : '☼ claro'}
      </Text>
    </Pressable>
  );
}

function QuickCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <View style={styles.quickCard}>
      <Text style={styles.quickLabel}>{label}</Text>
      <Text style={styles.quickValue}>{value}</Text>
      <Text style={styles.quickHint}>{hint}</Text>
    </View>
  );
}

function Step({ number, title }: { number: string; title: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepNumber}><Text style={styles.stepNumberText}>{number}</Text></View>
      <Text style={styles.stepTitle}>{title}</Text>
    </View>
  );
}

function StatusTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const colors = palettes.dark;
  return (
    <View style={[styles.statusCard, { backgroundColor: colors.surface }]}>
      <View style={[styles.statusMarker, { backgroundColor: accent ?? colors.accent }]} />
      <Text style={[styles.statusLabel, { color: colors.accent }]}>{label}</Text>
      <Text style={[styles.statusValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );
}

function DirectionButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const colors = palettes.dark;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={[
        styles.directionButton,
        { backgroundColor: active ? colors.accentSoft : colors.surface, borderColor: active ? colors.accent : colors.border },
      ]}
    >
      <Text style={[styles.directionButtonText, { color: active ? colors.accent : colors.muted }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function LoadingCard() {
  const colors = palettes.dark;
  return (
    <View style={[styles.loadingCard, { backgroundColor: colors.surface }]}>
      <Text style={[styles.loadingText, { color: colors.muted }]}>Carregando dados locais...</Text>
    </View>
  );
}

function ErrorCard({ message }: { message: string }) {
  const colors = palettes.dark;
  return (
    <View style={[styles.errorCard, { backgroundColor: '#3A1111' }]}>
      <Text style={[styles.errorText, { color: colors.danger }]}>{message}</Text>
    </View>
  );
}

function stationName(stations: LineStation[], stationId: number | null): string {
  if (stationId === null) return 'Não identificada';
  return stations.find((station) => station.stationId === stationId)?.stationName ?? 'Não identificada';
}

function locationLabel(state: MatchedTripState['locationState']): string {
  if (state === 'confirmed') return 'confirmada';
  if (state === 'estimated') return 'estimada';
  return 'indefinida';
}

function normalize(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase();
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 26 },
  page: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center' },
  brandMark: {
    width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  brandMarkText: { fontSize: 24, fontWeight: '900' },
  brandName: { fontSize: 21, fontWeight: '900', letterSpacing: 1.5 },
  brandCaption: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 1.4 },
  themeToggle: {
    minHeight: 40, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 13, borderWidth: 1,
  },
  themeToggleText: { fontSize: 13, fontWeight: '800' },

  heroCard: {
    borderRadius: 30, padding: 24,
    shadowColor: '#000000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.22, shadowRadius: 28, elevation: 4,
  },
  statusBadge: {
    alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center',
    borderRadius: 99, paddingHorizontal: 11, paddingVertical: 7, marginBottom: 20,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, marginRight: 7 },
  statusBadgeText: { fontSize: 10, letterSpacing: 1.1, fontWeight: '900' },
  heroEyebrow: { fontSize: 11, fontWeight: '800', letterSpacing: 1.8, marginBottom: 10 },
  heroTitle: { fontSize: 38, lineHeight: 43, fontWeight: '900', letterSpacing: -1.4 },
  heroSubtitle: { marginTop: 14, fontSize: 15, lineHeight: 23 },
  primaryButton: {
    minHeight: 58, marginTop: 22, alignItems: 'center', justifyContent: 'center', borderRadius: 18,
  },
  primaryButtonText: { fontSize: 17, fontWeight: '800' },

  quickRow: { flexDirection: 'row', gap: 12, marginTop: 14 },
  quickCard: { flex: 1, borderRadius: 20, padding: 16 },
  quickLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  quickValue: { marginTop: 6, fontSize: 19, fontWeight: '800' },
  quickHint: { marginTop: 3, fontSize: 12 },

  infoCard: { marginTop: 14, borderRadius: 22, padding: 18 },
  infoTitle: { fontSize: 16, fontWeight: '800' },
  steps: { marginTop: 14, gap: 10 },
  step: { flexDirection: 'row', alignItems: 'center' },
  stepNumber: {
    width: 34, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 11,
  },
  stepNumberText: { fontSize: 11, fontWeight: '900' },
  stepTitle: { fontSize: 14, fontWeight: '700' },

  header: { marginBottom: 22 },
  headerTopRow: { marginBottom: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backButton: { minHeight: 36, justifyContent: 'center' },
  backText: { fontSize: 14, fontWeight: '800' },
  eyebrow: { marginBottom: 9, fontSize: 11, fontWeight: '800', letterSpacing: 1.8 },
  headerTitle: { fontSize: 30, fontWeight: '900', letterSpacing: -1 },

  cardList: { gap: 12 },
  selectCard: {
    minHeight: 78, flexDirection: 'row', alignItems: 'center', borderRadius: 22, paddingHorizontal: 18,
  },
  lineColor: { width: 9, height: 42, borderRadius: 9, marginRight: 16 },
  selectCardText: { flex: 1 },
  selectTitle: { fontSize: 17, fontWeight: '800' },
  selectSubtitle: { marginTop: 4, fontSize: 13 },
  chevron: { fontSize: 24, fontWeight: '600' },

  directionRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  directionButton: {
    flex: 1, minHeight: 46, alignItems: 'center', justifyContent: 'center', borderRadius: 15, borderWidth: 1,
  },
  directionButtonText: { fontWeight: '700' },

  searchInput: {
    minHeight: 50, marginBottom: 14, borderRadius: 16, borderWidth: 1, paddingHorizontal: 16,
  },
  stationList: { gap: 10 },
  stationCard: {
    minHeight: 62, flexDirection: 'row', alignItems: 'center', borderRadius: 18, paddingHorizontal: 18,
  },
  stationDot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },
  stationName: { flex: 1, fontSize: 16, fontWeight: '700' },

  tripCard: { borderRadius: 28, padding: 24 },
  tripCardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1.4 },
  tripDestination: { marginTop: 8, fontSize: 30, fontWeight: '900', letterSpacing: -1 },
  tripMeta: { marginTop: 18, fontSize: 13 },

  statusGrid: { marginTop: 14, gap: 10 },
  statusCard: { borderRadius: 20, padding: 16 },
  statusMarker: { width: 34, height: 5, borderRadius: 3, marginBottom: 10 },
  statusLabel: { fontSize: 10, fontWeight: '800', letterSpacing: 1.2 },
  statusValue: { marginTop: 6, fontSize: 17, fontWeight: '800' },

  alertCard: {
    marginTop: 14, borderRadius: 20, borderWidth: 1, borderColor: '#F2C94C', padding: 18,
  },
  alertTitle: { fontSize: 17, fontWeight: '900' },
  alertText: { marginTop: 6, fontSize: 14 },

  simulatorCard: { marginTop: 18, borderRadius: 22, padding: 18 },
  sectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 4 },
  actionRow: { marginTop: 16, flexDirection: 'row', gap: 10 },
  actionButton: { flex: 1, marginTop: 0 },
  secondaryButton: {
    minHeight: 58, alignItems: 'center', justifyContent: 'center', borderRadius: 18, borderWidth: 1,
  },
  secondaryButtonText: { fontSize: 16, fontWeight: '800' },

  disclaimer: { marginTop: 18, fontSize: 13, lineHeight: 20 },
  loadingCard: { borderRadius: 18, padding: 22 },
  loadingText: { fontSize: 14 },
  errorCard: { marginTop: 14, borderRadius: 16, padding: 16 },
  errorText: { fontWeight: '700' },
});