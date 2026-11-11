# TÀI LIỆU ĐẶC TẢ YÊU CẦU & THIẾT KẾ SƠ BỘ
## Website quản lý hoạt động và chứng nhận sinh viên
**Phiên bản:** 1.0 | **Ngày lập:** 19/10/2026 | **Trạng thái:** Bản yêu cầu để rà soát trước khi lập trình  
**Tài liệu bàn giao cho nhân sự, nghiệp vụ và đội phát triển**

> **Mục tiêu:** Thống nhất yêu cầu, quy trình, dữ liệu và tiêu chí nghiệm thu trước khi bắt đầu lập trình.  
> **Trạng thái:** Bản đặc tả chi tiết sơ bộ. Các câu hỏi còn mở ở Mục 16 cần được chủ dự án xác nhận trước khi khóa thiết kế database.

---

## MỤC LỤC

1. MỤC ĐÍCH VÀ PHẠM VI
2. CÔNG NGHỆ ĐỀ XUẤT
3. NHÓM NGƯỜI DÙNG VÀ PHÂN QUYỀN
4. QUY TẮC TÀI KHOẢN SINH VIÊN (ĐÃ CHỐT)
5. QUY TRÌNH NGHIỆP VỤ
6. QUY TẮC NGHIỆP VỤ
7. MÀN HÌNH VÀ MODULE
8. THIẾT KẾ DATABASE SƠ BỘ
9. QUAN HỆ ERD (MÔ TẢ)
10. ĐỊNH NGHĨA CHỈ SỐ DASHBOARD
11. IMPORT EXCEL: HỢP ĐỒNG DỮ LIỆU
12. CHỨNG NHẬN PDF VÀ XÁC MINH
13. BẢO MẬT, RIÊNG TƯ VÀ VẬN HÀNH
14. TIÊU CHÍ NGHIỆM THU
15. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN
16. CÁC CÂU HỎI CẦN CHỐT TRƯỚC KHI KHÓA THIẾT KẾ
17. BÀN GIAO CHO NHÂN SỰ/ĐỘI KỸ THUẬT

## 1. MỤC ĐÍCH VÀ PHẠM VI

Mục đích: Xây dựng website tập trung để quản lý hồ sơ sinh viên, hoạt động, danh sách tham gia, quy trình duyệt, tự động phát hành chứng nhận PDF, tra cứu/xác minh chứng nhận và báo cáo thống kê.

Phạm vi phiên bản đầu (MVP): Một đơn vị/tổ chức duy nhất; quản lý sinh viên và khóa tuyển sinh; quản lý hoạt động; import Excel; duyệt cá nhân/hàng loạt; phát hành chứng nhận PDF; thu hồi chứng nhận; cổng sinh viên; dashboard, báo cáo, nhật ký kiểm toán và quản lý tài khoản/quyền.

Ngoài phạm vi MVP: Ứng dụng di động native; đa tổ chức/đa tenant; quy trình phê duyệt nhiều cấp; điểm danh QR thời gian thực; tích hợp hệ thống đào tạo bên ngoài; ký số pháp lý nâng cao; AI phân tích hành vi. Có thể xem xét ở giai đoạn sau.

Nguyên tắc triển khai: Chốt yêu cầu và mô hình dữ liệu trước; chưa bắt đầu viết code cho đến khi chủ dự án duyệt tài liệu. Các mục ghi 'CẦN CHỐT' là quyết định chưa được người dùng xác nhận.


## 2. CÔNG NGHỆ ĐỀ XUẤT

Nền tảng: Visual Studio; ASP.NET Core MVC; C#; Razor Views; Entity Framework Core; SQL Server; ASP.NET Core Identity; Bootstrap; Chart.js.

Phiên bản .NET: Khuyến nghị .NET 10 LTS nếu môi trường triển khai và thư viện tương thích. Nhóm kỹ thuật cần xác minh chính sách hỗ trợ và phiên bản SQL Server trước khi khóa phiên bản.

Tệp PDF: Lưu tệp PDF trong thư mục lưu trữ hoặc object storage có phân quyền; cơ sở dữ liệu lưu đường dẫn/khóa tệp và metadata, không mặc định lưu toàn bộ PDF dạng nhị phân trong SQL Server.

Xử lý nền: Tạo PDF nên chạy qua background worker/queue hoặc cơ chế xử lý nền tương đương. Không giữ transaction SQL mở trong thời gian render PDF.

Quản lý mã nguồn và triển khai: Git; cấu hình môi trường riêng cho Development/Staging/Production; bí mật kết nối lưu trong secret manager hoặc biến môi trường; không commit mật khẩu/connection string thật.


## 3. NHÓM NGƯỜI DÙNG VÀ PHÂN QUYỀN

Super Admin: Quản lý tài khoản quản trị, vai trò, cấu hình hệ thống, mẫu chứng nhận, nhật ký và các quyền cấp cao.

Admin cấp chứng nhận: Quản lý sinh viên, khóa tuyển sinh, hoạt động, import Excel, duyệt/từ chối lượt tham gia, phát hành/thu hồi chứng nhận, báo cáo và thông báo.

Sinh viên: Chỉ xem hồ sơ, lượt tham gia, trạng thái duyệt và chứng nhận của chính mình; tải PDF hợp lệ; đổi mật khẩu; cập nhật thông tin được phép.

Quy tắc phân quyền: Mặc định từ chối nếu không có quyền; kiểm tra quyền ở phía máy chủ cho mọi thao tác; không chỉ ẩn nút ở giao diện. Sinh viên không được truy cập dữ liệu người khác bằng cách sửa ID trên URL.


## 4. QUY TẮC TÀI KHOẢN SINH VIÊN (ĐÃ CHỐT)

Tên đăng nhập: MSSV là username đăng nhập. Cần giữ MSSV dạng chuỗi để không làm mất số 0 ở đầu.

Tạo tài khoản: Khi import hồ sơ sinh viên mới, hệ thống tạo tài khoản ở trạng thái chờ kích hoạt. Không tạo tài khoản trùng MSSV; không tự mở khóa tài khoản Disabled khi import lại.

Kích hoạt qua email: Nếu có email: gửi liên kết/token kích hoạt có thời hạn; token dùng một lần. Sau khi xác minh, sinh viên tự đặt mật khẩu.

Kích hoạt bằng mã riêng: Nếu không có email: quản trị viên tạo/cấp mã kích hoạt riêng cho từng sinh viên qua kênh được tổ chức phê duyệt. Mã có hạn dùng, dùng một lần; chỉ lưu hash mã trong database. Không dùng một mã chung cho cả lớp.

Đổi mật khẩu: Sinh viên vào Tài khoản của tôi → Đổi mật khẩu; nhập mật khẩu hiện tại và mật khẩu mới. Cần có luồng Quên mật khẩu an toàn. Không gửi mật khẩu hiện tại qua email.

Trạng thái tài khoản: PendingActivation, Active, Disabled. Tài khoản Disabled không đăng nhập được; việc mở khóa phải do người có quyền thực hiện.

Bảo mật: Dùng ASP.NET Core Identity để băm mật khẩu; không lưu mật khẩu dạng rõ; giới hạn thử đăng nhập; chống CSRF; cookie bảo mật; HTTPS; log sự kiện quan trọng nhưng không ghi mật khẩu/token thô.


## 5. QUY TRÌNH NGHIỆP VỤ

5.1 Import hồ sơ sinh viên: Admin tải Excel → chọn loại import Sinh viên → hệ thống kiểm tra định dạng/cột/dữ liệu → hiển thị preview và lỗi theo dòng → admin xác nhận import → cập nhật/tạo hồ sơ → tạo tài khoản PendingActivation nếu là sinh viên mới → ghi nhận kết quả batch.

5.2 Import danh sách tham gia: Admin tạo/chọn hoạt động trước → tải Excel danh sách tham gia → hệ thống đối chiếu MSSV đã tồn tại → preview các dòng hợp lệ, trùng, không tìm thấy MSSV hoặc lỗi → admin xác nhận → tạo lượt tham gia duy nhất theo cặp ActivityId + StudentId.

5.3 Duyệt tham gia: Admin duyệt hoặc từ chối từng dòng hoặc chọn hàng loạt. Có thể yêu cầu lý do khi từ chối. Mỗi dòng có kết quả riêng; một lỗi không làm mất kết quả của các dòng khác.

5.4 Phát hành chứng nhận: Khi lượt tham gia được duyệt, hệ thống tự đưa yêu cầu phát hành PDF vào hàng đợi. Trạng thái PDF được theo dõi riêng với trạng thái duyệt. Lỗi render/ghi tệp phải được log và cho phép retry; retry không tạo chứng nhận trùng.

5.5 Thu hồi chứng nhận: Admin có quyền thu hồi, bắt buộc ghi lý do. Giữ hồ sơ và PDF gốc; chuyển trạng thái Revoked; ghi người thực hiện và thời điểm. Trang xác minh công khai hiển thị trạng thái đã thu hồi.

5.6 Cổng sinh viên: Sinh viên đăng nhập bằng MSSV và mật khẩu; xem hồ sơ, hoạt động đã tham gia, trạng thái duyệt, danh sách chứng nhận, tải PDF; nhận thông báo về kết quả duyệt/phát hành/thu hồi nếu được cấu hình.

5.7 Báo cáo: Lọc theo khoảng thời gian, hoạt động, khóa tuyển sinh và trạng thái chứng nhận; xuất Excel. Số liệu dashboard phải lấy từ SQL thật và áp dụng định nghĩa thống nhất.


## 6. QUY TẮC NGHIỆP VỤ

BR-01: Hệ thống phục vụ một đơn vị/tổ chức duy nhất.

BR-02: Khóa tuyển sinh có mã như K23, K24, K25; phải hỗ trợ khóa mới trong tương lai.

BR-03: Có hai loại import độc lập: hồ sơ sinh viên và danh sách tham gia hoạt động.

BR-04: Tài khoản sinh viên mới được tạo khi import hồ sơ, ở trạng thái chờ kích hoạt.

BR-05: MSSV duy nhất; mỗi sinh viên chỉ có tối đa một lượt tham gia cho cùng một hoạt động trong phiên bản đầu.

BR-06: Admin duyệt một lượt tham gia là đủ điều kiện tự động tạo chứng nhận; MVP không yêu cầu thêm điều kiện chuyên cần riêng.

BR-07: Có một mẫu chứng nhận mặc định; mỗi hoạt động có thể chọn mẫu riêng. Nếu hoạt động không chọn mẫu riêng thì dùng mẫu mặc định tại thời điểm phát hành.

BR-08: Lỗi tạo PDF phải được xử lý theo từng chứng nhận, retry an toàn và không phát hành trùng.

BR-09: Thu hồi không xóa lịch sử; PDF cũ được giữ theo chính sách lưu trữ và chứng nhận hiển thị không còn hiệu lực.

BR-10: Duyệt, từ chối, phát hành, retry, thu hồi, thay đổi quyền và thao tác import phải được ghi nhật ký phù hợp.

BR-11: Dashboard phân biệt lượt tham gia, số sinh viên duy nhất, tỷ lệ tham gia theo khóa và số chứng nhận theo trạng thái.

BR-12: Sinh viên chỉ truy cập hồ sơ, hoạt động và chứng nhận thuộc chính mình.

BR-13: Import lại phải có tính idempotent: không tạo hồ sơ, tài khoản, lượt tham gia hoặc chứng nhận trùng.

BR-14: Tệp chứng nhận đã phát hành phải gắn với phiên bản mẫu đã dùng; thay mẫu mặc định không làm thay đổi PDF cũ.

BR-15: Không xóa cứng dữ liệu đã có lịch sử tham gia/chứng nhận; dùng trạng thái ngưng hoạt động, lưu trữ hoặc thu hồi.


## 7. MÀN HÌNH VÀ MODULE

Admin Dashboard: KPI: tổng sinh viên đang hoạt động; tổng hoạt động; lượt tham gia; sinh viên duy nhất; chứng nhận đang hiệu lực; chứng nhận bị thu hồi; chứng nhận tạo lỗi. Bộ lọc ngày, hoạt động, khóa.

Quản lý khóa: Danh sách/thêm/sửa/ngưng sử dụng khóa tuyển sinh; mã khóa duy nhất.

Quản lý sinh viên: Tìm theo MSSV, họ tên, lớp, khóa, trạng thái tài khoản; xem hồ sơ; kích hoạt lại/cấp mã mới theo quyền; không hiển thị mật khẩu.

Quản lý hoạt động: Mã, tên, mô tả, thời gian, trạng thái Draft/Open/Closed/Archived, mẫu chứng nhận tùy chọn.

Import Excel: Chọn loại import; chọn hoạt động khi import người tham gia; tải file; preview; báo lỗi từng dòng; tổng hợp thành công/trùng/bỏ qua/lỗi; lưu lịch sử batch.

Trung tâm duyệt: Lọc Pending; duyệt/từ chối từng dòng; duyệt hàng loạt; nhập lý do từ chối; hiển thị kết quả riêng từng dòng.

Kho chứng nhận: Tìm theo mã chứng nhận, MSSV, tên sinh viên, hoạt động, ngày phát hành, trạng thái; tải PDF; tải ZIP theo lô nếu được phân quyền; thu hồi.

Xác minh công khai: Tra cứu bằng mã chứng nhận hoặc QR chứa URL xác minh; chỉ công bố dữ liệu tối thiểu; hiển thị hợp lệ/đã thu hồi/không tìm thấy.

Báo cáo: Báo cáo theo hoạt động, khóa, thời gian, trạng thái; xuất Excel; định nghĩa chỉ số đi kèm.

Mẫu chứng nhận: Tải mẫu, khai báo vùng dữ liệu động, xem trước, phiên bản mẫu, chọn mẫu mặc định, lưu bản snapshot/phiên bản đã dùng.

Tài khoản và vai trò: Quản lý admin, vai trò, trạng thái; reset/cấp lại kích hoạt; nhật ký thay đổi quyền.

Nhật ký hệ thống: Tra cứu ai làm gì, khi nào, đối tượng nào, kết quả, lý do; không ghi bí mật.

Cổng sinh viên: Dashboard cá nhân, thông tin hồ sơ, lịch sử tham gia, chứng nhận, tải PDF, thông báo, đổi mật khẩu.


## 8. THIẾT KẾ DATABASE SƠ BỘ

Nguyên tắc: Dùng SQL Server; khóa chính identity cho dữ liệu nghiệp vụ; FK rõ ràng; MSSV và mã nghiệp vụ lưu kiểu chuỗi; thời gian dùng datetime2 UTC ở tầng lưu trữ và quy đổi múi giờ tại giao diện; trạng thái được ràng buộc bằng CHECK hoặc bảng danh mục.

ASP.NET Core Identity: Dùng AspNetUsers, AspNetRoles, AspNetUserRoles, AspNetUserClaims, AspNetUserLogins, AspNetRoleClaims, AspNetUserTokens do Identity quản lý. Username của tài khoản sinh viên bằng MSSV. Không tự xây cơ chế lưu password hash.

Cohorts: CohortId PK; CohortCode UNIQUE; CohortName; IsActive; CreatedAt.

Students: StudentId PK; StudentCode UNIQUE; FullName; Email NULL; ClassName NULL; CohortId FK; UserId FK Identity NULL/UNIQUE có lọc; IsActive; CreatedAt; UpdatedAt.

CertificateTemplates: TemplateId PK; TemplateName; FilePath; Version; IsDefault; IsActive; CreatedBy FK; CreatedAt. Chỉ một mẫu mặc định đang hoạt động; thay mặc định trong transaction.

Activities: ActivityId PK; ActivityCode UNIQUE; ActivityName; Description NULL; StartDate; EndDate; Status; TemplateId FK NULL; CreatedBy FK; CreatedAt; UpdatedAt.

ImportBatches: BatchId PK; FileName; ImportType Students/Participations; ActivityId FK NULL; ImportedBy FK; ImportedAt; TotalRows; SuccessRows; DuplicateRows; SkippedRows; ErrorRows; BatchStatus.

ImportRows: ImportRowId PK; BatchId FK; RowNumber; StudentCode; ProcessingStatus; ErrorMessage NULL; StudentId FK NULL; ParticipationId FK NULL; CreatedAt. UNIQUE(BatchId, RowNumber). Lưu kết quả từng dòng.

ActivityParticipations: ParticipationId PK; ActivityId FK; StudentId FK; ApprovalStatus Pending/Approved/Rejected; ApprovedBy FK NULL; ApprovedAt NULL; RejectedReason NULL; FirstImportBatchId FK NULL; CreatedAt; UpdatedAt. UNIQUE(ActivityId, StudentId).

Certificates: CertificateId PK; ParticipationId FK UNIQUE trong MVP; CertificateCode UNIQUE; TemplateId FK; TemplateVersion; TemplateSnapshotPath/TemplateSnapshotHash; IssuedAt; FilePath; Status Generating/Issued/Failed/Revoked; RevokedAt NULL; RevokedBy FK NULL; RevocationReason NULL; LastError NULL.

ApprovalLogs: ApprovalLogId PK; ParticipationId FK; ActorUserId FK; Action Approved/Rejected/Retry/Revoked; Reason NULL; CreatedAt.

AccountActivationTokens: ActivationTokenId PK; UserId FK; Method Email/ManualCode; TokenHash; ExpiresAt; UsedAt NULL; CreatedBy FK NULL; CreatedAt; RevokedAt NULL. Mã/token không lưu dạng rõ.

Notifications: NotificationId PK; UserId FK; Title; Message; IsRead; CreatedAt; ReadAt NULL.

AuditLogs: AuditLogId PK; ActorUserId FK NULL; Action; EntityType; EntityId; Timestamp; Outcome; Reason NULL; CorrelationId NULL; MetadataJson NULL đã lọc dữ liệu nhạy cảm.

CẦN CHỐT - cấp lại chứng nhận: Thiết kế MVP tạm đề xuất một bản ghi Certificate cho mỗi ParticipationId. Nếu cần thu hồi rồi cấp lại mã mới mà vẫn giữ hai lần phát hành, nên thêm CertificateVersions/CertificateIssues hoặc đổi mô hình thành bản ghi chứng nhận logic + nhiều lần phát hành. Chủ dự án cần xác nhận trước khi khóa schema.

Bảng nghiệp vụ cốt lõi được mô tả chi tiết trong file Excel đi kèm (sheet Data Dictionary). Đây là thiết kế sơ bộ; không phải migration SQL đã được triển khai.


## 9. QUAN HỆ ERD (MÔ TẢ)

Quan hệ chính: Cohorts 1—N Students; Identity User 0/1—1 Student; Activities 1—N ActivityParticipations; Students 1—N ActivityParticipations; ActivityParticipations 1—0/1 Certificates (MVP); CertificateTemplates 1—N Activities và 1—N Certificates; ImportBatches 1—N ImportRows; ImportRows có thể tham chiếu Student và Participation; User 1—N Notifications/ApprovalLogs/AuditLogs.

Ghi chú: Mô hình quan hệ cần được đội kỹ thuật dựng ERD cuối cùng trong SQL Server/diagrams.net sau khi chốt câu hỏi còn mở, đặc biệt quy trình cấp lại chứng nhận.


## 10. ĐỊNH NGHĨA CHỈ SỐ DASHBOARD

Tổng lượt tham gia: Đếm số bản ghi ActivityParticipations trong phạm vi bộ lọc, không đồng nghĩa với số người.

Sinh viên duy nhất đã tham gia: COUNT DISTINCT StudentId trong phạm vi bộ lọc.

Tỷ lệ tham gia theo khóa: Số StudentId duy nhất của khóa có ít nhất một lượt tham gia trong khoảng lọc / tổng số sinh viên đang hoạt động thuộc khóa × 100%. Phải ghi rõ khoảng thời gian và bộ lọc hoạt động.

Chứng nhận hiệu lực: Số Certificates có Status = Issued; không tính Generating, Failed hoặc Revoked.

Chứng nhận bị thu hồi: Số Certificates có Status = Revoked.

Lỗi tạo PDF: Số Certificates có Status = Failed; cần có thao tác retry được kiểm soát.


## 11. IMPORT EXCEL: HỢP ĐỒNG DỮ LIỆU

File sinh viên - cột bắt buộc: MSSV, Họ và tên, Mã khóa tuyển sinh. Email và Lớp là tùy chọn nếu tổ chức cho phép thiếu. Tên cột thực tế có thể cấu hình mapping trong màn hình import.

File người tham gia - cột bắt buộc: MSSV. Có thể thêm Họ tên để đối soát, nhưng MSSV là khóa đối chiếu chính. Hoạt động được admin chọn trên giao diện, không suy đoán từ tên file.

Kiểm tra: File .xlsx/.csv theo danh sách định dạng cho phép; giới hạn kích thước và số dòng; loại bỏ công thức không cần thiết; kiểm tra MSSV rỗng/định dạng; phát hiện dòng trùng; hiển thị preview trước khi ghi.

Kết quả: Lưu tổng số dòng, thành công, trùng, bỏ qua, lỗi; từng dòng có RowNumber, ProcessingStatus, ErrorMessage; cho phép tải báo cáo lỗi. Không báo thành công toàn bộ nếu còn dòng lỗi.


## 12. CHỨNG NHẬN PDF VÀ XÁC MINH

Trường hiển thị trên chứng nhận: Tên sinh viên; MSSV (nếu chính sách cho phép); tên hoạt động; ngày/đợt tổ chức; đơn vị cấp; ngày phát hành; mã chứng nhận; QR/URL xác minh. Nội dung cuối cùng do đơn vị phê duyệt.

Mẫu chứng nhận: Có mẫu mặc định và mẫu tùy chọn theo hoạt động. Mỗi lần phát hành phải lưu TemplateId, Version và dấu vết bản mẫu thực tế đã sử dụng.

Mã chứng nhận: Không tuần tự dễ đoán; duy nhất; đủ entropy; không chứa dữ liệu cá nhân nhạy cảm.

Xác minh công khai: Trang chỉ hiển thị thông tin tối thiểu cần xác minh. Không hiển thị email, ngày sinh, lớp/khóa hoặc các thông tin không cần thiết nếu chưa được phê duyệt.

Tệp: Không cho phép đoán đường dẫn tệp; tải PDF qua endpoint kiểm tra quyền hoặc URL tạm thời; sao lưu tệp; chính sách lưu trữ và phục hồi phải được thống nhất.


## 13. BẢO MẬT, RIÊNG TƯ VÀ VẬN HÀNH

Xác thực: ASP.NET Core Identity; password policy; lockout/rate limit; cookie Secure/HttpOnly/SameSite phù hợp; HTTPS bắt buộc trên production.

Phân quyền: Role-based + kiểm tra sở hữu dữ liệu; kiểm tra server-side; least privilege; admin không cần thiết không được cấp SuperAdmin.

Token kích hoạt: Sinh token ngẫu nhiên đủ mạnh; chỉ lưu hash; hết hạn; dùng một lần; vô hiệu hóa token cũ khi cấp lại; giới hạn số lần thử mã kích hoạt.

Nhật ký: Ghi thao tác nhạy cảm và kết quả; hạn chế quyền xem log; tránh log password, activation token, cookie, nội dung file nhạy cảm.

Sao lưu: Backup SQL và PDF; thử restore định kỳ; xác định RPO/RTO với đơn vị vận hành.

Xóa dữ liệu: Không xóa cứng hồ sơ có lịch sử chứng nhận; quy trình ẩn danh/xóa theo yêu cầu pháp lý cần được chủ dữ liệu duyệt.

Email: Cần cấu hình SMTP hoặc nhà cung cấp email; xác minh domain gửi; xử lý bounce/retry; không để lộ token trong log.


## 14. TIÊU CHÍ NGHIỆM THU

AC-01: Import sinh viên mới tạo đúng một hồ sơ và một tài khoản PendingActivation; username bằng MSSV.

AC-02: Import lại cùng MSSV không tạo bản ghi sinh viên/tài khoản trùng và không tự mở khóa tài khoản Disabled.

AC-03: Kích hoạt email thành công với token hợp lệ; token hết hạn/đã dùng bị từ chối.

AC-04: Mã kích hoạt thủ công riêng biệt, có hạn, dùng một lần; thử lại mã đã dùng thất bại.

AC-05: Sinh viên tự đặt mật khẩu và đăng nhập bằng MSSV; đổi mật khẩu yêu cầu mật khẩu hiện tại.

AC-06: Sinh viên A không thể xem/tải chứng nhận của sinh viên B kể cả sửa URL hoặc ID.

AC-07: Import người tham gia yêu cầu admin chọn hoạt động; dòng MSSV không tồn tại được báo lỗi rõ ràng.

AC-08: UNIQUE(ActivityId, StudentId) ngăn tạo lượt tham gia trùng khi import lại.

AC-09: Duyệt hàng loạt ghi kết quả riêng từng dòng; không mất toàn bộ batch nếu một dòng lỗi.

AC-10: Duyệt thành công đưa tác vụ tạo PDF vào xử lý; PDF lỗi có thể retry mà không tạo chứng nhận trùng.

AC-11: Chứng nhận bị thu hồi giữ lại lịch sử, ghi lý do/người/thời điểm và không được tính là hiệu lực.

AC-12: Thay mẫu mặc định không thay đổi PDF đã phát hành.

AC-13: Dashboard định nghĩa đúng lượt tham gia, sinh viên duy nhất, tỷ lệ theo khóa và chứng nhận hiệu lực.

AC-14: Export Excel tuân theo bộ lọc và không tiết lộ dữ liệu vượt quyền.

AC-15: Các thao tác import, duyệt, phát hành, retry, thu hồi và thay đổi quyền có audit log.

AC-16: Kiểm thử backup/restore database và tệp PDF thành công trong môi trường staging.


## 15. KẾ HOẠCH TRIỂN KHAI THEO GIAI ĐOẠN

Giai đoạn 0 — Chốt yêu cầu: Chủ dự án xác nhận các mục CẦN CHỐT, nội dung mẫu chứng nhận, dữ liệu Excel, chính sách email/mã kích hoạt, quy trình thu hồi/cấp lại.

Giai đoạn 1 — Thiết kế: Use case, wireframe, ERD, data dictionary, migration plan, ma trận quyền, tiêu chí nghiệm thu.

Giai đoạn 2 — Nền tảng: Tạo solution ASP.NET Core MVC, Identity, SQL Server, logging, cấu hình môi trường, role seeding.

Giai đoạn 3 — Dữ liệu: CRUD khóa/sinh viên/hoạt động; import preview và batch tracking.

Giai đoạn 4 — Duyệt/chứng nhận: Trung tâm duyệt, worker tạo PDF, kho chứng nhận, xác minh, thu hồi và retry.

Giai đoạn 5 — Cổng sinh viên: Kích hoạt, đăng nhập, đổi/quên mật khẩu, lịch sử và tải chứng nhận.

Giai đoạn 6 — Dashboard/QA: Báo cáo, export, kiểm thử phân quyền, bảo mật, tải, backup/restore.

Giai đoạn 7 — Go-live: UAT, hướng dẫn người dùng, triển khai, theo dõi lỗi, bàn giao tài liệu và mã nguồn.


## 16. CÁC CÂU HỎI CẦN CHỐT TRƯỚC KHI KHÓA THIẾT KẾ

Q1 — Cấp lại chứng nhận: Nếu chứng nhận đã bị thu hồi, có cho phép cấp lại chứng nhận mới với mã mới và vẫn giữ lịch sử chứng nhận cũ không? Nếu có, cần mô hình nhiều lần phát hành.

Q2 — Mã kích hoạt thủ công: Mã do Super Admin/Admin tạo và giao trực tiếp cho sinh viên, hay xuất danh sách mã một lần để cán bộ phát? Không gửi mã kích hoạt chung cho cả lớp.

Q3 — Dữ liệu Excel: Tên cột chính xác, định dạng MSSV, tên khóa/lớp, email có thể thiếu ở tỷ lệ bao nhiêu? Có cần mapping cột linh hoạt không?

Q4 — Mẫu chứng nhận: Đơn vị đã có file mẫu (DOCX/PPTX/PNG/PDF) chưa? Ai duyệt nội dung, chữ ký, con dấu và trường thông tin?

Q5 — Email: Có SMTP/domain email tổ chức chưa? Ai quản lý thông tin cấu hình và xác minh domain?

Q6 — Công khai xác minh: Trang xác minh có hiển thị họ tên đầy đủ và MSSV không, hay chỉ họ tên rút gọn + hoạt động + trạng thái?

Q7 — Dữ liệu và lưu trữ: Ước lượng số sinh viên, số hoạt động/năm, số chứng nhận/năm; thời hạn lưu PDF và log; chính sách backup.

Q8 — Vai trò: Có đúng hai vai trò quản trị (Super Admin và Admin cấp chứng nhận) hay cần thêm người nhập liệu/người duyệt riêng?

| Mã | Quyết định cần xác nhận | Người/đơn vị xác nhận |
| --- | --- | --- |
| Q1 | Nếu chứng nhận đã bị thu hồi, có cho phép cấp lại chứng nhận mới với mã mới và vẫn giữ lịch sử chứng nhận cũ không? Nếu có, cần mô hình nhiều lần phát hành. | ________________ |
| Q2 | Mã do Super Admin/Admin tạo và giao trực tiếp cho sinh viên, hay xuất danh sách mã một lần để cán bộ phát? Không gửi mã kích hoạt chung cho cả lớp. | ________________ |
| Q3 | Tên cột chính xác, định dạng MSSV, tên khóa/lớp, email có thể thiếu ở tỷ lệ bao nhiêu? Có cần mapping cột linh hoạt không? | ________________ |
| Q4 | Đơn vị đã có file mẫu (DOCX/PPTX/PNG/PDF) chưa? Ai duyệt nội dung, chữ ký, con dấu và trường thông tin? | ________________ |
| Q5 | Có SMTP/domain email tổ chức chưa? Ai quản lý thông tin cấu hình và xác minh domain? | ________________ |
| Q6 | Trang xác minh có hiển thị họ tên đầy đủ và MSSV không, hay chỉ họ tên rút gọn + hoạt động + trạng thái? | ________________ |
| Q7 | Ước lượng số sinh viên, số hoạt động/năm, số chứng nhận/năm; thời hạn lưu PDF và log; chính sách backup. | ________________ |
| Q8 | Có đúng hai vai trò quản trị (Super Admin và Admin cấp chứng nhận) hay cần thêm người nhập liệu/người duyệt riêng? | ________________ |


## 17. BÀN GIAO CHO NHÂN SỰ/ĐỘI KỸ THUẬT

Đầu ra bắt buộc: 1) Tài liệu yêu cầu đã được duyệt; 2) sơ đồ quy trình; 3) ERD; 4) data dictionary; 5) ma trận phân quyền; 6) mẫu Excel import; 7) wireframe; 8) test cases/UAT; 9) kế hoạch backup/restore; 10) hướng dẫn quản trị và người dùng.

Điều kiện bắt đầu code: Không bắt đầu code nghiệp vụ chính trước khi Q1–Q8 được trả lời hoặc được chủ dự án chấp thuận ghi nhận là giả định. Mọi thay đổi sau khi khóa yêu cầu phải được ghi vào change log.

Lưu ý cho nhân sự: Đây là bản đặc tả yêu cầu và thiết kế sơ bộ, không phải schema cuối cùng đã chạy trên SQL Server. Đội kỹ thuật cần review, chốt quyết định mở, tạo ERD cuối và xác nhận tiêu chí nghiệm thu trước triển khai.


## PHỤ LỤC A — QUY ƯỚC TRẠNG THÁI

| Đối tượng | Giá trị | Ý nghĩa |
| --- | --- | --- |
| Tài khoản | PendingActivation / Active / Disabled | Chờ kích hoạt / Hoạt động / Vô hiệu hóa |
| Hoạt động | Draft / Open / Closed / Archived | Nháp / Đang mở / Đã đóng / Lưu trữ |
| Duyệt tham gia | Pending / Approved / Rejected | Chờ duyệt / Đã duyệt / Từ chối |
| Chứng nhận | Generating / Issued / Failed / Revoked | Đang tạo / Đã phát hành / Lỗi / Đã thu hồi |
| Import batch | Preview / Completed / Failed | Xem trước / Hoàn tất / Thất bại |
| Dòng import | Valid / Imported / Skipped / Error | Hợp lệ / Đã nhập / Bỏ qua / Lỗi |


## PHỤ LỤC B — CHỈ MỤC VÀ RÀNG BUỘC CƠ SỞ DỮ LIỆU

- UNIQUE Students(StudentCode).
- UNIQUE Cohorts(CohortCode).
- UNIQUE Activities(ActivityCode).
- UNIQUE ActivityParticipations(ActivityId, StudentId).
- UNIQUE Certificates(CertificateCode).
- UNIQUE Certificates(ParticipationId) nếu giữ phương án một chứng nhận logic cho mỗi lượt tham gia.
- UNIQUE ImportRows(BatchId, RowNumber).
- Filtered UNIQUE Students(UserId) khi UserId IS NOT NULL.
- Filtered UNIQUE CertificateTemplates(IsDefault) cho mẫu mặc định đang hoạt động; cần đảm bảo transaction khi chuyển mẫu mặc định.
- Index ActivityParticipations(ApprovalStatus, ActivityId), ActivityParticipations(StudentId, ApprovalStatus), Certificates(Status, IssuedAt), Notifications(UserId, IsRead, CreatedAt).
- CHECK constraints cho các cột trạng thái; kiểm tra nghiệp vụ ở backend vẫn bắt buộc.
- FK dùng ON DELETE RESTRICT/NO ACTION cho dữ liệu lịch sử; tránh cascade xóa hồ sơ chứng nhận.

## PHỤ LỤC C — GHI CHÚ PHÂN TÁCH TRẠNG THÁI

ApprovalStatus của lượt tham gia và Status của chứng nhận là hai trạng thái khác nhau. Một lượt có thể đã Approved nhưng chứng nhận đang Generating hoặc Failed. Dashboard và giao diện phải hiển thị rõ, không coi Approved đồng nghĩa với PDF đã sẵn sàng.

Đối với duyệt hàng loạt, ghi nhận kết quả từng bản ghi. Transaction ngắn chỉ cập nhật trạng thái và tạo yêu cầu phát hành; tạo PDF chạy riêng và có khóa/idempotency để tránh trùng.
