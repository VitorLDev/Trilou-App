import { Stack } from 'expo-router';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { migrateDbIfNeeded } from '@/infrastructure/database/migrations';
import { seedOfficialFortalezaData } from '@/infrastructure/database/seed';

async function initializeDatabase(db: Parameters<typeof migrateDbIfNeeded>[0]) {
  await migrateDbIfNeeded(db);
  await seedOfficialFortalezaData(db);
}

export default function RootLayout() {
  return (
    <SQLiteProvider databaseName="trilou.db" onInit={initializeDatabase}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
      <StatusBar style="dark" />
    </SQLiteProvider>
  );
}