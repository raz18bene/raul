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
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none"><rect x="4" y="18" width="36" height="15" rx="3" stroke="var(--primary)" strokeWidth="2"/><path d="M12 18V13a2 2 0 012-2h16a2 2 0 012 2v5" stroke="var(--primary)" strokeWidth="2"/><rect x="13" y="23" width="18" height="10" rx="1.5" stroke="var(--primary)" strokeWidth="1.5"/><circle cx="36" cy="26" r="2.5" fill="var(--primary)" opacity=".8"/><line x1="18" y1="27" x2="27" y2="27" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="22" y1="13" x2="22" y2="5" stroke="var(--primary)" strokeWidth="2" strokeLinecap="round"/><path d="M18 9l4-4 4 4" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
  )
}

export function GearIcon({ size = 36 }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none"><path d="M20 6l2.5 1.5 2-1 2 2-1 2L27 13v4l-1.5 2.5 1 2-2 2-2-1L20 24l-2.5-1.5-2 1-2-2 1-2L13 17v-4l1.5-2.5-1-2 2-2 2 1z" stroke="var(--primary)" strokeWidth="2" strokeLinejoin="round"/><circle cx="20" cy="17" r="4" stroke="var(--primary)" strokeWidth="2"/><circle cx="31" cy="28" r="4" stroke="var(--primary)" strokeWidth="1.5"/><circle cx="31" cy="28" r="1.5" fill="var(--primary)"/><line x1="31" y1="22" x2="31" y2="20" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="31" y1="34" x2="31" y2="36" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="25" y1="28" x2="23" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/><line x1="37" y1="28" x2="35" y2="28" stroke="var(--primary)" strokeWidth="1.5" strokeLinecap="round"/></svg>
  )
}

