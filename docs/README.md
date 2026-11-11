# TÀI LIỆU DỰ ÁN: WEBSITE QUẢN LÝ HOẠT ĐỘNG VÀ CHỨNG NHẬN SINH VIÊN

Hệ thống quản lý tập trung hồ sơ sinh viên, hoạt động ngoại khóa/phong trào, duyệt danh sách tham gia, tự động phát hành và xác minh chứng nhận PDF trực tuyến cho trường học/đơn vị đào tạo.

---

## 📚 Danh mục tài liệu Markdown

| STT | Tài liệu | Nội dung chính |
|---|---|---|
| 1 | [Đặc tả yêu cầu & Thiết kế sơ bộ](./Tai_lieu_yeu_cau_website_quan_ly_chung_nhan_sinh_vien.md) | Phạm vi MVP, quy trình nghiệp vụ, quy tắc BR-01..15, các màn hình, tiêu chí nghiệm thu AC-01..16, kế hoạch 8 giai đoạn |
| 2 | [Từ điển dữ liệu & Kịch bản kiểm thử](./Tu_dien_du_lieu_va_kiem_thu_website_chung_nhan.md) | Cấu trúc 11 bảng dữ liệu, 24 test cases, ma trận phân quyền 3 roles, bảng theo dõi 8 quyết định mở (Q1–Q8) |

---

## 🎯 Tổng quan hệ thống (MVP)

- **Đối tượng sử dụng:**
  - **Super Admin:** Quản trị cấu hình, phân quyền, mẫu chứng nhận, nhật ký kiểm toán.
  - **Admin cấp chứng nhận:** Quản lý sinh viên, hoạt động, import Excel, duyệt tham gia, phát hành/thu hồi chứng nhận.
  - **Sinh viên:** Đăng nhập bằng MSSV, theo dõi hoạt động, tải chứng nhận PDF cá nhân, đổi mật khẩu.
  - **Công chúng/Nhà tuyển dụng:** Tra cứu, xác minh tính hợp lệ của chứng nhận qua mã/QR code.
- **Công nghệ đề xuất:**
  - Backend: C# / ASP.NET Core MVC (khuyến nghị .NET 10 LTS), EF Core, ASP.NET Core Identity.
  - Cơ sở dữ liệu: SQL Server (lưu trữ metadata; file PDF lưu trên filesystem/object storage).
  - Frontend: Razor Views, Bootstrap 5, Chart.js.
  - Xử lý nền: Background Worker / Queue tạo PDF bất đồng bộ.

---

## ⚡ Các quyết định quan trọng cần chốt (Q1 – Q8)

Trước khi tiến hành lập trình và khóa schema database, cần thống nhất 8 câu hỏi cốt lõi tại [Mục 16](./Tai_lieu_yeu_cau_website_quan_ly_chung_nhan_sinh_vien.md#16-các-câu-hỏi-cần-chốt-trước-khi-khóa-thiết-kế) hoặc [Sheet Open Decisions](./Tu_dien_du_lieu_va_kiem_thu_website_chung_nhan.md#4-các-quyết-định-còn-mở-open-decisions).
