# Kế hoạch xây dựng TánGPT

## Phạm vi
- Thay trang mẫu bằng trải nghiệm TánGPT hoàn chỉnh, ưu tiên màn hình điện thoại nhưng vẫn đẹp trên máy tính.
- Toàn bộ chữ hiển thị bằng tiếng Việt, phong cách tối cao cấp, mang năng lượng đêm Sài Gòn và nét cà phê Hà Nội.
- Hoàn thiện các trang `/`, `/login`, `/app`, và khung đầu trang `/app/chat/:companionId`.

## Giao diện và nhận diện
- Thiết lập font Be Vietnam Pro, bảng màu tối, bề mặt kính, hạt nền nhẹ, bóng phát sáng và chuyển động 300ms.
- Tạo hệ màu theo bốn vùng miền; đổi vùng sẽ đổi màu nhấn, bong bóng chat, ánh sáng và minh họa toàn ứng dụng.
- Dùng minh họa SVG nét tối giản theo từng vùng; không dùng ảnh người thật hoặc linh vật hoạt hình.
- Đảm bảo vùng bấm tối thiểu 48px, hỗ trợ vùng an toàn iPhone và bố cục thích ứng tốt.

## Các luồng chính
- Trang giới thiệu: thanh đầu trang, nội dung chính, điện thoại demo tự chuyển Bắc/Nam/Trung mỗi 3 giây, hai cách dùng, vùng miền, điểm khác biệt và chân trang.
- Đăng nhập/đăng ký: biểu mẫu email, mật khẩu, hiện/ẩn mật khẩu, lỗi tiếng Việt và nút Google dạng chờ kết nối.
- Onboarding ba bước: xác nhận 18+, chọn vùng/thành phố với đổi màu trực tiếp, chọn nhóm tuổi.
- Ứng dụng bốn mục: Gợi ý, Bạn gái AI, Lịch sử, Tôi; thanh điều hướng kính cố định phía dưới.
- Gợi ý trả lời/mở lời: lựa chọn vùng, thành phố, tuổi; tạo ba kết quả giả lập sau 1,5 giây; sao chép; tạo lại; mẹo; trạng thái lỗi giới hạn mở paywall.
- Bạn gái AI: danh sách nhân vật theo vùng, thẻ thông tin, bảng xác nhận tính cách/chế độ, danh sách trò chuyện và thêm nhân vật.
- Lịch sử: lưu các lần gợi ý mới nhất trong phiên và sao chép lại.
- Tôi: mặc định vùng/thành phố, trạng thái gói, xóa lịch sử, đăng xuất và liên kết chính sách.
- Paywall: bảng kính với hai gói, nút nâng cấp bị khóa, không hiển thị trong bong bóng chat.

## Cấu trúc và dữ liệu
- Tách RegionPicker, RegionThemeProvider, PersonaCard, ChatBubble, Paywall và các phần dùng chung.
- Kích hoạt Lovable Cloud cho đăng nhập và dữ liệu tài khoản; giao diện vẫn có dữ liệu mẫu để xem ngay.
- Giữ phần tạo gợi ý theo cấu trúc dữ liệu có thể thay bằng lời gọi dịch vụ sau này, không đặt khóa bí mật ở trình duyệt.
- Trang chat chi tiết chỉ dựng phần đầu trang như yêu cầu hiện tại.

## Kiểm tra
- Kiểm tra các trang và thao tác chính ở kích thước điện thoại và máy tính.
- Kiểm tra chuyển vùng, onboarding, tạo gợi ý, sao chép, chọn nhân vật, paywall và thanh điều hướng.
- Kiểm tra lỗi hiển thị, độ tương phản, dấu tiếng Việt và thông tin chia sẻ riêng cho từng trang.
