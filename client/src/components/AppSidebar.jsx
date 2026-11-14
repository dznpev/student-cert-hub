import { useState } from 'react'
import hutechLogo from '../assets/hutech-logo.png'

export default function AppSidebar({ navigationId, navigationLabel, sections, activeSectionId, onSelectSection, onHome, children }) {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <aside className={'portal-sidebar' + (menuOpen ? ' portal-sidebar--open' : '')}>
      {/* The sliding surface is this inner panel, so the fixed mobile trigger
          below is never a descendant of the transform (R37). */}
      <div className="portal-sidebar__panel">
        <div className="portal-sidebar__brand">
          {onHome ? (
            <button type="button" className="portal-sidebar__logo-button" aria-label="HUTECH — Về trang chủ"
              onClick={() => { setMenuOpen(false); onHome() }}>
              <span className="portal-logo-chip">
                <img className="portal-logo-chip__img" src={hutechLogo} alt="HUTECH" width={70} height={18} />
              </span>
            </button>
          ) : (
            <span className="portal-logo-chip">
              <img className="portal-logo-chip__img" src={hutechLogo} alt="HUTECH" width={70} height={18} />
            </span>
          )}
          <div className="portal-sidebar__names">
            <span className="portal-sidebar__product">Quản lý Chứng nhận</span>
            <span className="portal-sidebar__brandline">HUTECH</span>
          </div>
        </div>

        <nav id={navigationId} aria-label={navigationLabel} className="portal-nav">
          {sections.map(({ group, items }, index) => (
            <div className="portal-nav__group" key={group ?? index}>
              {group && <p className="portal-nav__group-label">{group}</p>}
              <ul className="portal-nav__list">
                {items.map((item) => {
                  const active = item.id === activeSectionId
                  return (
                    <li key={item.id}>
                      <button type="button"
                        className={'portal-nav__item' + (active ? ' portal-nav__item--active' : '')}
                        aria-current={active ? 'page' : undefined}
                        onClick={() => { setMenuOpen(false); onSelectSection(item.id) }}>
                        {item.icon && <span className="portal-nav__icon" aria-hidden="true">{item.icon}</span>}
                        <span className="portal-nav__label">{item.title}</span>
                        {item.badge > 0 && <span className="portal-nav__badge">{item.badge}</span>}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
          {children}
        </nav>
      </div>

      <button type="button" className="portal-sidebar__toggle"
        aria-controls={navigationId} aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
        Menu
      </button>
    </aside>
  )
}
