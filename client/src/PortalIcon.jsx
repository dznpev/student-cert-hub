const paths = {
  overview: 'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',
  cohorts: 'm2 9 10-5 10 5-10 5-10-5Z M6 11v6l6 3 6-3v-6 M22 9v6',
  students: 'M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M22 21v-2a4 4 0 0 0-3-4 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M17 3a4 4 0 0 1 0 8',
  activities: 'M8 2v4 M16 2v4 M3 10h18 M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z M8 15h3',
  participations: 'M8 4H5a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V6a2 2 0 0 0-2-2h-3 M8 2h8v5H8z M7 14l3 3 6-6',
  certificates: 'M3 3h18v13h-6 M9 16H3V3 M8 7h8 M12 12a3 3 0 1 0 0 6 3 3 0 0 0 0-6Z M9 17l-1 5 4-2 4 2-1-5',
  imports: 'M12 16V3 m-4 4 4-4 4 4 M4 14v6h16v-6',
  audit: 'M6 3h12v18H6z M9 8h6 M9 12h6 M9 16h6',
  workspace: 'M3 7h18v13H3z M8 7V4h8v3 M3 13h18 M10 13v2h4v-2',
  accounts: 'M12 22s8-4 8-12V5l-8-3-8 3v5c0 8 8 12 8 12Z M9 12l2 2 4-4',
  templates: 'M3 4h18v16H3z M3 9h18 M9 9v11',
  'back-to-super-admin': 'M19 12H5 m6-6-6 6 6 6',
  profile: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z M4 21v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2',
  password: 'M6 10h12v11H6z M8 10V7a4 4 0 0 1 8 0v3 M12 14v3',
  pending: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M12 7v5l3 2',
  revoked: 'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z M5 5l14 14',
  error: 'm12 3 10 18H2L12 3Z M12 9v5 M12 17h.01',
}

export default function PortalIcon({ name }) {
  return (
    <svg className="portal-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">
      <path d={paths[name === 'account' ? 'accounts' : name] ?? paths.overview} />
    </svg>
  )
}
