# Crop Calendar — Lịch mùa vụ và chu kỳ cây trồng

Web-app giúp người quản lý biết **mỗi khu trồng đang ở giai đoạn nào** và **sắp tới cần làm gì**.

Luồng MVP: **Crop profile → nhập ngày trồng → sinh lịch mẫu → calendar → checklist**.

## Tính năng

- **Thêm khu trồng**: chọn loại cây, ngày trồng (hoặc ngày bắt đầu chu kỳ với cây lâu năm), tên, diện tích, vị trí. Xem trước timeline trước khi tạo.
- **Tự sinh timeline** các giai đoạn sinh trưởng và toàn bộ công việc (việc một lần hoặc lặp lại mỗi N ngày trong giai đoạn).
- **Tổng quan**: việc hôm nay, việc trễ hạn, 7 ngày tới; thẻ từng khu trồng hiển thị giai đoạn hiện tại, % chu kỳ, việc sắp tới.
- **Chi tiết khu trồng**: thanh timeline có mốc "Hôm nay", danh sách giai đoạn kèm công việc, checklist, lịch tháng tô màu theo giai đoạn, nhật ký thực tế.
- **Checklist & Lịch** chung cho mọi khu trồng, lọc theo khu và loại việc (💧 tưới, 🧪 bón phân, ✂️ tỉa cành, 🐛 sâu bệnh, 🧺 thu hoạch).
- **Nhắc lịch**: thông báo trình duyệt mỗi ngày và xuất file `.ics` (nhắc lúc 6:00 sáng) để nhập vào Google Calendar / điện thoại.
- **Kỹ sư điều chỉnh lịch theo thực tế**:
  - kéo dài/rút ngắn từng giai đoạn (±1, ±7 ngày), các giai đoạn sau tự dời theo;
  - dời một việc, thêm ghi chú, bỏ qua, khôi phục lịch gốc;
  - dời hàng loạt các việc chưa làm do thời tiết/nhân công (tự ghi vào nhật ký);
  - thêm việc phát sinh (có thể lặp lại).
- **Thư viện quy trình**: có sẵn 3 quy trình mẫu (🍈 sầu riêng, ☕ cà phê Robusta, 🌾 lúa 100 ngày). Có thể chỉnh sửa, nhân bản hoặc tạo quy trình mới (giai đoạn, số ngày, màu, công việc, chu kỳ lặp).
- Sao lưu / khôi phục dữ liệu JSON, nạp lại dữ liệu mẫu. Hỗ trợ giao diện tối và điện thoại.

Dữ liệu lưu trong `localStorage` của trình duyệt (chưa có backend).

## Chạy dự án

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # unit test cho logic sinh lịch
npm run build    # build tĩnh ra dist/ (base tương đối, deploy được lên bất kỳ static host nào)
```

## Cấu trúc

```
src/
  types.ts              Mô hình dữ liệu: CropProfile, StageTemplate, TaskTemplate, Plot…
  data/crops.ts         Thư viện quy trình mẫu và loại công việc
  lib/schedule.ts       Sinh giai đoạn + công việc từ quy trình, áp điều chỉnh của kỹ sư
  lib/date.ts           Xử lý ngày dạng yyyy-mm-dd (UTC, không lệch múi giờ)
  lib/ics.ts            Xuất lịch iCalendar có nhắc việc
  store.tsx             State (useReducer) + lưu localStorage + dữ liệu demo
  pages/                Tổng quan, Khu trồng, Lịch, Checklist, Thư viện, Thêm khu trồng
  components/           TaskRow, Timeline, CalendarGrid, Modal…
```

Lịch không lưu từng công việc đã sinh; nó được tính lại từ `quy trình + ngày trồng + điều chỉnh`. Điều chỉnh của kỹ sư lưu theo khóa ổn định (`taskId#lần`), nên khi sửa quy trình trong thư viện, mọi khu trồng dùng quy trình đó tự cập nhật.

## Hướng mở rộng

- Thư viện quy trình theo vùng khí hậu (nhiều biến thể cho cùng một loại cây).
- Điều chỉnh lịch tự động dựa trên dữ liệu thời tiết, cảm biến và nhật ký thực tế.
- Backend + đăng nhập để nhiều kỹ sư/nông hộ dùng chung, push notification.
