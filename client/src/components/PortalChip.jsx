const TONES = ['success', 'warn', 'danger', 'info', 'mute']

export default function PortalChip({ tone = 'mute', label }) {
  const safeTone = TONES.includes(tone) ? tone : 'mute'
  return <span className={'portal-chip portal-chip--' + safeTone}>{label}</span>
}
