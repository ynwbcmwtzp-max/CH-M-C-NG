# Ứng dụng chấm công Trạm CSGT Phú Quốc — bản kỹ thuật thử nghiệm

## Trạng thái
Đây là **bản thử nghiệm có mã nguồn**, chưa được phê duyệt để sử dụng dữ liệu công tác thật. Có đăng nhập, phân quyền admin/editor/viewer, bảng chấm công, dữ liệu tập trung, xuất ba báo cáo XLSX dạng bảng cơ bản. **Chưa tái hiện đúng 100% bố cục và quy tắc nghiệp vụ của ba biểu mẫu gốc**, chưa có chức năng sửa số giờ trực tiếp, quản lý phân quyền qua giao diện, hoặc kiểm thử bảo mật độc lập.

## Trước khi sử dụng
Không đưa dữ liệu cán bộ thật lên GitHub hoặc Supabase/Vercel khi chưa có chấp thuận của đơn vị. Dùng tài khoản và dữ liệu giả để thử nghiệm. Kho GitHub phải đặt Private. Không tải `.env.local` hay khóa service-role lên GitHub.

## Cài đặt
1. Tạo dự án Supabase (chỉ khi được phép sử dụng đám mây), vào SQL Editor chạy `supabase/schema.sql`.
2. Vào Authentication > Users, tạo tài khoản thử nghiệm đầu tiên. Chạy lệnh SQL cuối file để cấp `admin` cho UUID của tài khoản này. Thêm người dùng thử nghiệm khác và phân quyền `editor` khi cần. **Tắt public signup** để tránh người lạ tự đăng ký.
3. Trong Vercel, import kho GitHub chứa mã nguồn. Thêm Environment Variables `NEXT_PUBLIC_SUPABASE_URL` và `NEXT_PUBLIC_SUPABASE_ANON_KEY` (publishable/anon key, không dùng service-role key). Nhấn Deploy.
4. Trên MacBook có Node.js: `npm install`, tạo `.env.local` dựa trên `.env.example`, sau đó `npm run dev` để chạy thử.
5. Trong trang ứng dụng, tài khoản admin thêm cán bộ thử nghiệm, tài khoản editor chấm công. Xuất báo cáo từ các nút tương ứng.

## Ghi chú nghiệp vụ
- Mã trạng thái thử nghiệm: LV làm việc, CT công tác, H học, P phép, TS thai sản, N nghỉ, TB trực ban, K khác.
- Bản thử nghiệm gán 8 giờ mặc định cho LV/CT/TB; **đây là giả định kỹ thuật**, không phải quy định được xác nhận từ biểu mẫu. Cần thiết kế nhập giờ làm thực tế và kiểm chứng điều kiện hưởng trước khi dùng tính tiền ăn.
- Báo cáo T9 hiện chỉ là bảng tổng hợp minh họa; không tự suy ra mức hưởng hoặc căn cứ pháp lý.
- Để khớp hoàn toàn ba tệp Excel gốc cần bổ sung logic tính, vị trí ô, merge, border, font, chữ ký, tổng hợp và kiểm thử từng biểu mẫu.
- Nếu không được phép dùng dịch vụ đám mây, không triển khai bản này với dữ liệu thật; chuyển sang hạ tầng được đơn vị phê duyệt.
