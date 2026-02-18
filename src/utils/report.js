const SUPABASE_URL = 'https://qcsrmfhkgmuqzzmvdfqb.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFjc3JtZmhrZ211cXp6bXZkZnFiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNjk4NzEsImV4cCI6MjA4Njg0NTg3MX0.XtQ1KDVgRkPUq-CGUr_P4iVQMs0vbgB6BjfherOrZ9A';

const FIRESTORE_DOC_LIMIT = 900_000;

const SUPABASE_HEADERS = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

/**
 * Submit report to Supabase: CSV to Storage, metadata to table.
 */
async function submitToSupabase({ reportId, csvContent, description, contact, reportType }) {
  const csvPath = `${reportId}.csv`;

  // 1. Upload CSV to Storage bucket "reports"
  const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/reports/${csvPath}`, {
    method: 'POST',
    headers: {
      ...SUPABASE_HEADERS,
      'Content-Type': 'text/csv',
    },
    body: csvContent,
  });

  if (!uploadRes.ok) {
    const err = await uploadRes.text();
    throw new Error(`Supabase Storage error: ${uploadRes.status} ${err}`);
  }

  // 2. Insert metadata into reports table
  const insertRes = await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
    method: 'POST',
    headers: {
      ...SUPABASE_HEADERS,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal',
    },
    body: JSON.stringify({
      report_id: reportId,
      report_type: reportType,
      description,
      contact: contact || '',
      csv_path: csvPath,
      status: 'new',
    }),
  });

  if (!insertRes.ok) {
    const err = await insertRes.text();
    throw new Error(`Supabase DB error: ${insertRes.status} ${err}`);
  }
}

/**
 * Submit report to Firebase Firestore.
 */
async function submitToFirebase({ reportId, csvContent, description, contact, reportType }) {
  const { db } = await import('./firebase.js');
  const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

  await addDoc(collection(db, 'reports'), {
    reportId,
    reportType,
    description,
    contact: contact || '',
    csvContent,
    status: 'new',
    createdAt: serverTimestamp(),
  });
}

// Set to true to skip Firebase and send everything to Supabase
const FIREBASE_DISABLED = true;

/**
 * Submit an anonymized report.
 * Tries Firebase first. Falls back to Supabase if Firebase fails or CSV is too large.
 */
export async function submitReport({ csvContent, description, contact, reportType }) {
  const reportId = `report_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const payload = { reportId, csvContent, description, contact, reportType };

  if (FIREBASE_DISABLED || csvContent.length > FIRESTORE_DOC_LIMIT) {
    await submitToSupabase(payload);
    return reportId;
  }

  try {
    await submitToFirebase(payload);
  } catch (firebaseErr) {
    console.warn('Firebase failed, falling back to Supabase:', firebaseErr);
    await submitToSupabase(payload);
  }

  return reportId;
}
