import type Database from 'better-sqlite3';

const MIGRATIONS: { version: number; up: (db: Database.Database) => void }[] = [
  {
    version: 1,
    up(db) {
      db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version INTEGER PRIMARY KEY,
          applied_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS applications (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          company TEXT NOT NULL,
          position TEXT NOT NULL,
          date_applied TEXT NOT NULL,
          status TEXT NOT NULL,
          job_url TEXT,
          notes TEXT,
          created_at TEXT NOT NULL DEFAULT (datetime('now')),
          updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS status_changes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          application_id INTEGER NOT NULL,
          old_status TEXT,
          new_status TEXT NOT NULL,
          note TEXT,
          changed_at TEXT NOT NULL DEFAULT (datetime('now')),
          FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE
        );

        CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
        CREATE INDEX IF NOT EXISTS idx_applications_date ON applications(date_applied);
        CREATE INDEX IF NOT EXISTS idx_status_changes_app ON status_changes(application_id);
      `);
    },
  },
  {
    version: 2,
    up(db) {
      const columns = db.prepare('PRAGMA table_info(applications)').all() as { name: string }[];
      const existing = new Set(columns.map((c) => c.name));

      const newColumns: [string, string][] = [
        ['source', 'TEXT'],
        ['location', 'TEXT'],
        ['work_type', 'TEXT'],
        ['role_type', 'TEXT'],
        ['salary_min', 'INTEGER'],
        ['salary_max', 'INTEGER'],
        ['follow_up_date', 'TEXT'],
        ['last_contact_date', 'TEXT'],
        ['priority', "TEXT NOT NULL DEFAULT 'Medium'"],
        ['contact_name', 'TEXT'],
        ['contact_email', 'TEXT'],
        ['next_action', 'TEXT'],
      ];

      for (const [name, type] of newColumns) {
        if (!existing.has(name)) {
          db.exec(`ALTER TABLE applications ADD COLUMN ${name} ${type}`);
        }
      }

      const scColumns = db.prepare('PRAGMA table_info(status_changes)').all() as { name: string }[];
      if (!scColumns.some((c) => c.name === 'note')) {
        db.exec('ALTER TABLE status_changes ADD COLUMN note TEXT');
      }

      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_applications_role ON applications(role_type);
        CREATE INDEX IF NOT EXISTS idx_applications_source ON applications(source);
        CREATE INDEX IF NOT EXISTS idx_applications_follow_up ON applications(follow_up_date);
        CREATE INDEX IF NOT EXISTS idx_applications_updated ON applications(updated_at);
      `);
    },
  },
];

export function runMigrations(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  const applied = new Set(
    (db.prepare('SELECT version FROM schema_migrations').all() as { version: number }[]).map(
      (r) => r.version
    )
  );

  for (const migration of MIGRATIONS) {
    if (!applied.has(migration.version)) {
      migration.up(db);
      db.prepare('INSERT INTO schema_migrations (version) VALUES (?)').run(migration.version);
    }
  }
}
