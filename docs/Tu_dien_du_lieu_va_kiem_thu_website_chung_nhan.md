# TỪ ĐIỂN DỮ LIỆU, KIỂM THỬ VÀ MA TRẬN PHÂN QUYỀN
## Website quản lý hoạt động và chứng nhận sinh viên

Tài liệu chi tiết kỹ thuật đi kèm tài liệu đặc tả yêu cầu, bao gồm:
1. [Từ điển dữ liệu (Data Dictionary)](#1-từ-điển-dữ-liệu-data-dictionary)
2. [Kịch bản kiểm thử (Test Cases)](#2-kịch-bản-kiểm-thử-test-cases)
3. [Ma trận phân quyền (Role Matrix)](#3-ma-trận-phân-quyền-role-matrix)
4. [Các quyết định còn mở (Open Decisions)](#4-các-quyết-định-còn-mở-open-decisions)

---

## 1. Từ điển dữ liệu (Data Dictionary)

> 💡 **Ghi chú chuyển đổi sang MySQL 8.0+ (Quyết định kiến trúc mới):**
> - `int / bigint IDENTITY` $\rightarrow$ `INT / BIGINT AUTO_INCREMENT`.
> - `nvarchar(n)` $\rightarrow$ `VARCHAR(n) CHARACTER SET utf8mb4`.
> - `nvarchar(max)` $\rightarrow$ `LONGTEXT CHARACTER SET utf8mb4`.
> - `datetime2` $\rightarrow$ `DATETIME(6)`.
> - `bit` $\rightarrow$ `TINYINT(1)`.
> - **Filtered UNIQUE Index:** MySQL không hỗ trợ index điều kiện (`WHERE`). Với `CertificateTemplates.IsDefault`, ràng buộc "chỉ 1 mẫu mặc định" sẽ được đảm bảo bằng **Transaction ở tầng ứng dụng** (`UPDATE IsDefault = 0` trước khi gán mẫu mới). Với `Students.UserId`, MySQL cho phép nhiều giá trị `NULL` trong index UNIQUE nên `UNIQUE(UserId)` đáp ứng tốt.
> - Tổng số bảng nghiệp vụ cốt lõi: **12 bảng** (bao gồm bảng `Notifications`).

### Bảng: Cohorts

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| CohortId | int | PK, IDENTITY | Khóa chính khóa tuyển sinh |
| CohortCode | varchar(10) | UNIQUE, NOT NULL | Mã khóa, ví dụ K23 |
| CohortName | nvarchar(100) | NOT NULL | Tên hiển thị khóa |
| IsActive | bit | NOT NULL, DEFAULT 1 | Khóa còn được sử dụng |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |

### Bảng: Students

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| StudentId | int | PK, IDENTITY | Khóa chính hồ sơ sinh viên |
| StudentCode | varchar(20) | UNIQUE, NOT NULL | MSSV; giữ dạng chuỗi |
| FullName | nvarchar(150) | NOT NULL | Họ tên |
| Email | nvarchar(256) | NULL | Email sinh viên, có thể thiếu |
| ClassName | nvarchar(50) | NULL | Lớp hành chính |
| CohortId | int | FK Cohorts, NOT NULL | Khóa tuyển sinh |
| UserId | nvarchar(450) | FK AspNetUsers, NULL, UNIQUE FILTERED | Tài khoản Identity liên kết |
| IsActive | bit | NOT NULL, DEFAULT 1 | Hồ sơ còn hoạt động |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |
| UpdatedAt | datetime2 | NULL | Thời điểm cập nhật gần nhất |

### Bảng: CertificateTemplates

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| TemplateId | int | PK, IDENTITY | Khóa chính mẫu |
| TemplateName | nvarchar(150) | NOT NULL | Tên mẫu |
| FilePath | nvarchar(500) | NOT NULL | Đường dẫn/khóa tệp mẫu |
| Version | int | NOT NULL | Phiên bản mẫu |
| IsDefault | bit | NOT NULL, DEFAULT 0 | Mẫu mặc định |
| IsActive | bit | NOT NULL, DEFAULT 1 | Mẫu còn dùng |
| CreatedBy | nvarchar(450) | FK AspNetUsers, NOT NULL | Người tạo mẫu |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |

### Bảng: Activities

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| ActivityId | int | PK, IDENTITY | Khóa chính hoạt động |
| ActivityCode | varchar(30) | UNIQUE, NOT NULL | Mã hoạt động |
| ActivityName | nvarchar(200) | NOT NULL | Tên hoạt động |
| Description | nvarchar(max) | NULL | Mô tả |
| StartDate | datetime2 | NOT NULL | Thời điểm bắt đầu |
| EndDate | datetime2 | NOT NULL | Thời điểm kết thúc |
| Status | varchar(20) | NOT NULL, CHECK | Draft/Open/Closed/Archived |
| TemplateId | int | FK CertificateTemplates, NULL | Mẫu riêng; NULL dùng mẫu mặc định |
| CreatedBy | nvarchar(450) | FK AspNetUsers, NOT NULL | Người tạo |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |
| UpdatedAt | datetime2 | NULL | Thời điểm cập nhật |

### Bảng: ImportBatches

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| BatchId | bigint | PK, IDENTITY | Mã đợt import |
| FileName | nvarchar(260) | NOT NULL | Tên file gốc |
| ImportType | varchar(30) | NOT NULL, CHECK | Students/Participations |
| ActivityId | int | FK Activities, NULL | Bắt buộc với import người tham gia |
| ImportedBy | nvarchar(450) | FK AspNetUsers, NOT NULL | Người import |
| ImportedAt | datetime2 | NOT NULL | Thời điểm import |
| TotalRows | int | NOT NULL | Tổng dòng dữ liệu |
| SuccessRows | int | NOT NULL | Dòng thành công |
| DuplicateRows | int | NOT NULL | Dòng trùng |
| SkippedRows | int | NOT NULL | Dòng bỏ qua |
| ErrorRows | int | NOT NULL | Dòng lỗi |
| BatchStatus | varchar(20) | NOT NULL, CHECK | Preview/Completed/Failed |

### Bảng: ImportRows

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| ImportRowId | bigint | PK, IDENTITY | Khóa chính dòng import |
| BatchId | bigint | FK ImportBatches, NOT NULL | Đợt import |
| RowNumber | int | NOT NULL, UNIQUE with BatchId | Số dòng Excel |
| StudentCode | varchar(20) | NOT NULL | MSSV từ file |
| ProcessingStatus | varchar(20) | NOT NULL, CHECK | Valid/Imported/Skipped/Error |
| ErrorMessage | nvarchar(1000) | NULL | Thông báo lỗi cụ thể |
| StudentId | int | FK Students, NULL | Hồ sơ sinh viên liên quan |
| ParticipationId | bigint | FK ActivityParticipations, NULL | Lượt tham gia liên quan |
| CreatedAt | datetime2 | NOT NULL | Thời điểm xử lý |

### Bảng: ActivityParticipations

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| ParticipationId | bigint | PK, IDENTITY | Khóa chính lượt tham gia |
| ActivityId | int | FK Activities, NOT NULL | Hoạt động |
| StudentId | int | FK Students, NOT NULL | Sinh viên |
| ApprovalStatus | varchar(20) | NOT NULL, CHECK | Pending/Approved/Rejected |
| ApprovedBy | nvarchar(450) | FK AspNetUsers, NULL | Người duyệt |
| ApprovedAt | datetime2 | NULL | Thời điểm duyệt |
| RejectedReason | nvarchar(500) | NULL | Lý do từ chối |
| FirstImportBatchId | bigint | FK ImportBatches, NULL | Batch đầu tiên tạo lượt tham gia |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |
| UpdatedAt | datetime2 | NULL | Thời điểm cập nhật |

### Bảng: Certificates

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| CertificateId | bigint | PK, IDENTITY | Khóa chính chứng nhận |
| ParticipationId | bigint | FK ActivityParticipations, UNIQUE | Một chứng nhận logic mỗi lượt tham gia trong MVP |
| CertificateCode | varchar(50) | UNIQUE, NOT NULL | Mã xác minh duy nhất, khó đoán |
| TemplateId | int | FK CertificateTemplates, NOT NULL | Mẫu đã dùng |
| TemplateVersion | int | NOT NULL | Phiên bản mẫu |
| TemplateSnapshotPath | nvarchar(500) | NULL | Đường dẫn snapshot mẫu thực tế |
| TemplateSnapshotHash | varchar(128) | NULL | Hash để xác định snapshot |
| IssuedAt | datetime2 | NULL | Thời điểm phát hành thành công |
| FilePath | nvarchar(500) | NULL | Đường dẫn PDF |
| Status | varchar(20) | NOT NULL, CHECK | Generating/Issued/Failed/Revoked |
| RevokedAt | datetime2 | NULL | Thời điểm thu hồi |
| RevokedBy | nvarchar(450) | FK AspNetUsers, NULL | Người thu hồi |
| RevocationReason | nvarchar(500) | NULL | Lý do thu hồi |
| LastError | nvarchar(1000) | NULL | Lỗi gần nhất khi tạo PDF |

### Bảng: AccountActivationTokens

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| ActivationTokenId | bigint | PK, IDENTITY | Khóa chính token/mã kích hoạt |
| UserId | nvarchar(450) | FK AspNetUsers, NOT NULL | Tài khoản |
| Method | varchar(20) | NOT NULL, CHECK | Email/ManualCode |
| TokenHash | varchar(256) | NOT NULL | Hash token; không lưu mã rõ |
| ExpiresAt | datetime2 | NOT NULL | Hạn dùng |
| UsedAt | datetime2 | NULL | Thời điểm sử dụng |
| CreatedBy | nvarchar(450) | FK AspNetUsers, NULL | Người cấp mã thủ công |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |
| RevokedAt | datetime2 | NULL | Thời điểm vô hiệu hóa |

### Bảng: ApprovalLogs

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| ApprovalLogId | bigint | PK, IDENTITY | Khóa chính nhật ký duyệt |
| ParticipationId | bigint | FK ActivityParticipations, NOT NULL | Lượt tham gia |
| ActorUserId | nvarchar(450) | FK AspNetUsers, NOT NULL | Người thực hiện |
| Action | varchar(30) | NOT NULL, CHECK | Approved/Rejected/Retry/Revoked |
| Reason | nvarchar(500) | NULL | Lý do |
| CreatedAt | datetime2 | NOT NULL | Thời điểm |

### Bảng: Notifications

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| NotificationId | bigint | PK, IDENTITY | Khóa chính thông báo |
| UserId | nvarchar(450) | FK AspNetUsers, NOT NULL | Người nhận |
| Title | nvarchar(200) | NOT NULL | Tiêu đề |
| Message | nvarchar(1000) | NOT NULL | Nội dung |
| IsRead | bit | NOT NULL, DEFAULT 0 | Đã đọc hay chưa |
| CreatedAt | datetime2 | NOT NULL | Thời điểm tạo |
| ReadAt | datetime2 | NULL | Thời điểm đọc |

### Bảng: AuditLogs

| Field | SQL Server Type | Constraints / Index | Description |
| --- | --- | --- | --- |
| AuditLogId | bigint | PK, IDENTITY | Khóa chính audit |
| ActorUserId | nvarchar(450) | FK AspNetUsers, NULL | Người thực hiện; NULL cho tác vụ hệ thống |
| Action | varchar(100) | NOT NULL | Tên hành động |
| EntityType | varchar(100) | NOT NULL | Loại đối tượng |
| EntityId | nvarchar(100) | NULL | ID đối tượng |
| Timestamp | datetime2 | NOT NULL | Thời điểm |
| Outcome | varchar(30) | NOT NULL | Success/Failure/Partial |
| Reason | nvarchar(1000) | NULL | Lý do/kết quả |
| CorrelationId | varchar(100) | NULL | Mã liên kết một yêu cầu |
| MetadataJson | nvarchar(max) | NULL | Metadata đã lọc dữ liệu nhạy cảm |


---
## 2. Kịch bản kiểm thử (Test Cases)

| Test ID | Scenario | Input / Preconditions | Expected Result |
| --- | --- | --- | --- |
| TC-01 | Tạo tài khoản sinh viên mới | Import Excel có MSSV chưa tồn tại | Có đúng 1 Student; đúng 1 Identity User; username = MSSV; trạng thái PendingActivation |
| TC-02 | Import lại MSSV | Import cùng file lần hai | Không sinh bản ghi trùng; báo duplicate/updated theo quy tắc đã chọn |
| TC-03 | Thiếu email | Import sinh viên email rỗng | Tài khoản chờ kích hoạt; có thể cấp mã thủ công |
| TC-04 | Kích hoạt email hợp lệ | Token còn hạn và chưa dùng | Cho đặt mật khẩu; token đánh dấu UsedAt |
| TC-05 | Kích hoạt token hết hạn | Token đã quá ExpiresAt | Từ chối và hướng dẫn xin token mới |
| TC-06 | Dùng lại token | Token đã UsedAt | Từ chối |
| TC-07 | Mã kích hoạt thủ công | Mã hợp lệ đúng tài khoản | Cho đặt mật khẩu; mã dùng một lần |
| TC-08 | Thử sai mã nhiều lần | Nhập mã sai liên tục | Rate limit/lockout theo chính sách |
| TC-09 | Đổi mật khẩu | Sinh viên nhập đúng mật khẩu hiện tại | Đổi thành công và thông báo |
| TC-10 | Sinh viên truy cập chứng nhận người khác | Đổi ID trong URL | Bị từ chối 403/404, không lộ dữ liệu |
| TC-11 | Import người tham gia không chọn hoạt động | Upload file participant | Không cho xác nhận import |
| TC-12 | MSSV không tồn tại | Danh sách có MSSV lạ | Dòng được đánh lỗi, không tự tạo sinh viên ngầm |
| TC-13 | Import người tham gia trùng | Cùng MSSV/hoạt động hai lần | Không tạo participation trùng |
| TC-14 | Duyệt hàng loạt | Chọn nhiều dòng, một dòng có lỗi | Kết quả từng dòng rõ ràng; các dòng hợp lệ vẫn xử lý |
| TC-15 | PDF thành công | Duyệt lượt tham gia hợp lệ | Tạo đúng một chứng nhận và PDF |
| TC-16 | PDF thất bại | Giả lập lỗi render/ghi file | Status Failed, có log; retry được |
| TC-17 | Retry PDF | Retry một certificate Failed | Không sinh certificate logic trùng |
| TC-18 | Thu hồi | Admin nhập lý do thu hồi | Status Revoked; có người/giờ/lý do; PDF cũ còn lưu |
| TC-19 | Xác minh chứng nhận thu hồi | Tra cứu mã đã thu hồi | Trang xác minh hiển thị Đã thu hồi |
| TC-20 | Thay mẫu mặc định | Đổi mẫu sau khi đã phát hành | PDF/chứng nhận cũ vẫn tham chiếu snapshot/phiên bản cũ |
| TC-21 | Dashboard | Lọc theo khóa và thời gian | Số liệu khớp truy vấn và định nghĩa |
| TC-22 | Audit log | Duyệt/thu hồi/thay quyền | Có actor, action, thời điểm, outcome |
| TC-23 | Backup/restore | Khôi phục bản backup staging | Database và PDF tham chiếu khôi phục thành công |
| TC-24 | Disabled account | Tài khoản bị vô hiệu hóa rồi import lại | Không tự mở khóa; đăng nhập bị chặn |


---
## 3. Ma trận phân quyền (Role Matrix)

| Role | Purpose | System Settings | Student Management | Activity Management | Import Excel | Approval | Certificate Management | Reports |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Super Admin | Quản lý vai trò/tài khoản admin | Có | Có | Có | Có | Có | Có | Có |
| Admin cấp chứng nhận | Sinh viên/hoạt động/import/duyệt/chứng nhận/báo cáo | Không | Có | Có | Có | Có | Có | Có |
| Sinh viên | Hồ sơ cá nhân, lượt tham gia, chứng nhận của mình | Không | Chỉ bản thân | Không | Không | Không | Chỉ của mình | Không |


---
## 4. Các quyết định còn mở (Open Decisions)

| ID | Decision | Current Proposal / Question | Owner | Status |
| --- | --- | --- | --- | --- |
| Q1 | Cấp lại chứng nhận sau thu hồi | Có cho phép phát hành chứng nhận mới với mã mới, giữ chứng nhận cũ? Nếu có, cần mô hình nhiều lần phát hành. | Chủ dự án | Chưa chốt |
| Q2 | Phát mã kích hoạt thủ công | Admin cấp trực tiếp từng mã hay xuất danh sách mã một lần để cán bộ phát? | Chủ dự án/nhân sự | Chưa chốt |
| Q3 | Cấu trúc Excel | Tên cột chính xác, MSSV có số 0 đầu, email/lớp/khóa có thể thiếu không? Có cần mapping cột? | Nhân sự | Chưa chốt |
| Q4 | Mẫu chứng nhận | Đã có file mẫu chưa; trường thông tin; chữ ký/con dấu; người duyệt mẫu? | Đơn vị | Chưa chốt |
| Q5 | Email kích hoạt | Có SMTP/domain email tổ chức chưa? Ai quản lý cấu hình? | IT | Chưa chốt |
| Q6 | Trang xác minh công khai | Hiển thị họ tên/MSSV đầy đủ hay rút gọn? | Chủ dự án | Chưa chốt |
| Q7 | Quy mô và lưu trữ | Số sinh viên/hoạt động/chứng nhận mỗi năm; thời hạn lưu; backup và RPO/RTO. | IT/đơn vị | Chưa chốt |
| Q8 | Vai trò quản trị | Chỉ Super Admin + Admin cấp chứng nhận hay cần thêm người nhập liệu/người duyệt? | Chủ dự án | Chưa chốt |
