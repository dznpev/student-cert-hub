const dateFormatter = new Intl.DateTimeFormat('vi-VN', {
  dateStyle: 'short',
  timeStyle: 'short',
  timeZone: 'Asia/Ho_Chi_Minh',
})

export default function NotificationsPage({ notifications, onReadNotification }) {
  const unreadCount = notifications.filter((item) => !item.isRead).length

  return (
    <div className="p-3">
      <h2 className="h5 text-primary mb-2" id="student-notification-heading">Thông báo</h2>
      <p className="small text-body-secondary" role="status">{unreadCount} thông báo chưa đọc</p>
      {notifications.length === 0 ? (
        <div className="text-center py-4">
          <h3 className="h6">Chưa có thông báo</h3>
          <p className="text-body-secondary mb-0">Thông báo mới sẽ hiển thị ở đây.</p>
        </div>
      ) : (
        <ul className="list-group">
          {notifications.map((item) => (
            <li key={item.notificationId} className="list-group-item p-3">
              <h3 className="h6 mb-1">{item.title}</h3>
              <time className="small text-body-secondary" dateTime={item.createdAt}>{dateFormatter.format(new Date(item.createdAt))}</time>
              <p className="my-2 text-break">{item.message}</p>
              {item.isRead ? <span className="small text-body-secondary">Đã đọc</span> : (
                <button type="button" className="btn btn-sm btn-outline-primary"
                  onClick={() => onReadNotification(item.notificationId, item.studentId)}>Đánh dấu đã đọc</button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
