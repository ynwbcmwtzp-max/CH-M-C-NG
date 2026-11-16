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

## Danh mục và quy tắc chấm công
- 11 trạng thái: TTKS, XLVPHC, CT, H, P, TS, N (Nghỉ T7, CN), NB, BENH, TH, NL.
- Chỉ TTKS được tính ngày làm việc. Khi chọn TTKS, mặc định lưu 8 giờ; trạng thái khác lưu 0 giờ.
- Bảng ngày ghi X cho TTKS, để trống ô ngày XLVPHC. Các cột tổng hợp đếm riêng từng trạng thái, không cộng XLVPHC vào ngày làm việc.
- Định lượng chỉ xét TTKS: từ 4 giờ ghi X; trên 0 đến dưới 4 giờ ghi 1/2. Giữ cách chia theo giờ của báo cáo hiện có.
- T9 chỉ đánh dấu và đếm ngày TTKS; không tự điền mức hưởng.
- LV, TB, K cũ vẫn giữ nguyên, hiển thị là dữ liệu cũ và không tự quy đổi thành TTKS. Không cập nhật hàng loạt dữ liệu chấm công.
- Danh mục có trên giao diện và một sheet riêng trong cả ba báo cáo. Bố cục báo cáo vẫn là bảng cơ bản, chưa tái tạo mẫu Excel gốc.

## Cập nhật dự án đang có dữ liệu
1. Kiểm tra trực tiếp ràng buộc `attendance_status_check` trong Supabase có khớp schema trong kho không.
2. Chạy `supabase/migrations/20261116_attendance_statuses.sql` trước khi triển khai giao diện mới. Migration chỉ mở rộng mã được phép, giữ các mã cũ, không UPDATE/DELETE dữ liệu và không đổi phân quyền. Nếu tên ràng buộc khác, dừng và đối chiếu trước khi chạy.
3. Không chạy lại `supabase/schema.sql` trên dự án đã có dữ liệu; file này chỉ dành cho dự án trống.
4. Sau migration, triển khai bản sửa trên Vercel, kiểm tra đăng nhập, danh mục và xuất báo cáo. Không tạo dữ liệu thử vào bảng chấm công thật.

## Kiểm tra
- Node.js 22.6+ để chạy `npm test` (kiểm tra 11 trạng thái, mã cũ, mốc giờ, ba báo cáo và ranh giới tháng).
- `npm run build` kiểm tra bản dựng Next.js và TypeScript.
