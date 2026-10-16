// Iconitele oficiale ale categoriilor TechNest — sursa unica, folosita pe prima pagina si la „Despre noi".

export type IconProps = { size?: number }

export function SpoolIcon({ size = 36 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none"><circle cx="22" cy="22" r="18" stroke="var(--primary)" strokeWidth="2"/><circle cx="22" cy="22" r="7" stroke="var(--primary)" strokeWidth="2"/><circle cx="22" cy="22" r="3" fill="var(--primary)"/><line x1="22" y1="4" x2="22" y2="15" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/><line x1="22" y1="29" x2="22" y2="40" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round"/></svg>
  )
}

export function ChipIcon({ size = 36 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none"><rect x="13" y="13" width="18" height="18" rx="3" stroke="var(--primary)" strokeWidth="2"/><rect x="17" y="17" width="10" height="10" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="var(--primary)" fillOpacity=".15"/><line x1="17" y1="13" x2="17" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="13" x2="22" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="27" y1="13" x2="27" y2="7" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="17" y1="31" x2="17" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="22" y1="31" x2="22" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="27" y1="31" x2="27" y2="37" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="17" x2="7" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="22" x2="7" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="13" y1="27" x2="7" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="17" x2="37" y2="17" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="22" x2="37" y2="22" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><line x1="31" y1="27" x2="37" y2="27" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/></svg>
  )
}

export function PrintIcon({ size = 36 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none">
      <path d="M22 6L8 14v16l14 8 14-8V14L22 6z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 14l14 8 14-8" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/>
      <line x1="22" y1="22" x2="22" y2="38" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/>
      <line x1="22" y1="16" x2="22" y2="20" stroke="var(--primary)" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
    </svg>
  )
}

// Piese imprimante 3D: cheie fixa (wrench) — iconita aleasa pentru aceasta categorie, peste tot pe site.
export function GearIcon({ size = 36 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path
        d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
        stroke="var(--primary)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"
      />
    </svg>
  )
}
