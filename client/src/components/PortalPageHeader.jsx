export default function PortalPageHeader({ title, description, actions }) {
  return (
    <div className="portal-page-header">
      <div className="portal-page-header__text">
        <h1 className="portal-page-header__title">{title}</h1>
        {description && <p className="portal-page-header__description">{description}</p>}
      </div>
      {actions && <div className="portal-page-header__actions">{actions}</div>}
    </div>
  )
}
