// The footer carries the institutional copyright and the build version only.
// The "Tra cứu chứng nhận" link that used to live here was removed: it is a
// navigation link into the public lookup, which does not belong on the admin
// or student shells. The lookup stays reachable where it is useful - the
// signed-out student screens (StudentLogin) and the template preview QR code.
const FOOTER_VERSION = '1.0'

export default function PortalFooter() {
  return (
    <footer className="portal-footer">
      <div className="portal-footer__brand">
        {'© 2012–2026 HUTECH University. All rights reserved '}
        <span className="portal-footer__muted">| Version {FOOTER_VERSION}</span>
      </div>
    </footer>
  )
}
