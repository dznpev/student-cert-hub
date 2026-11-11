import { useState } from 'react'
import AdminLayout from './AdminLayout.jsx'
import ActivitiesPage from './ActivitiesPage.jsx'
import CohortsPage from './CohortsPage.jsx'
import DashboardPage from './DashboardPage.jsx'
import StudentsPage from './StudentsPage.jsx'

const sections = [
  { id: 'overview', title: 'Tổng quan', page: DashboardPage },
  { id: 'cohorts', title: 'Khóa tuyển sinh', page: CohortsPage },
  { id: 'students', title: 'Sinh viên', page: StudentsPage },
  { id: 'activities', title: 'Hoạt động', page: ActivitiesPage },
  { id: 'participations', title: 'Lượt tham gia' },
  { id: 'certificates', title: 'Chứng nhận' },
  { id: 'imports', title: 'Nhập dữ liệu Excel' },
  { id: 'audit', title: 'Nhật ký hệ thống' },
]

export default function App() {
  const [activeSectionId, setActiveSectionId] = useState('overview')
  const activeSection = sections.find((section) => section.id === activeSectionId)
  const ActivePage = activeSection.page

  return (
    <AdminLayout
      sections={sections}
      activeSectionId={activeSectionId}
      onSelectSection={setActiveSectionId}
      roleLabel="Admin cấp chứng nhận"
    >
      {ActivePage ? (
        <ActivePage />
      ) : (
        <>
          <h1 className="page-title mb-4">{activeSection.title}</h1>
          <div className="card content-card">
            <div className="card-body p-4">
              <p className="text-body-secondary mb-0">
                {activeSection.description ?? 'Mục này đang được xây dựng.'}
              </p>
            </div>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
