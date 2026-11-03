# InvoiceHubX

Giao diện (UI-only) cho nền tảng quản lý hoá đơn điện tử: gom hoá đơn đầu vào/ra theo nhiều mã số thuế, đối soát VAT, cảnh báo MST rủi ro, gói dịch vụ & thanh toán.

**Stack:** Next.js 16 (App Router, static export) · Mantine 9 (core, charts, dates, spotlight, notifications) · Tabler Icons.

> Dữ liệu hiện là mock (`src/lib/data.ts`), chưa kết nối backend.

## Trang

| Đường dẫn | Nội dung |
|---|---|
| `/` | Landing page |
| `/app` | Dashboard: KPI, biểu đồ dòng tiền, VAT tạm tính, NCC lớn nhất, cảnh báo rủi ro |
| `/app/invoices` | Kho hoá đơn: lọc (trạng thái, ngày, thuế suất, rủi ro), sắp xếp, chọn hàng loạt, xuất CSV, drawer chi tiết |
| `/app/lookup` | Tra cứu MST: nhập là tự tra, kiểm tra chữ số kiểm tra, tra hàng loạt, xuất Excel |
| `/app/xml-reader` | Đọc hoá đơn XML (TT78): kéo-thả nhiều file, hiển thị như hoá đơn, tự đối chiếu số liệu, chữ ký số, xuất Excel |
| `/app/tools` | Công cụ kế toán: tính VAT, số tiền bằng chữ, thuế TNCN từ lương, tra cứu MST, lịch hạn nộp thuế, rà soát điều kiện khấu trừ |
| `/app/companies` | Quản lý MST, wizard thêm MST 3 bước |
| `/app/sync` | Trung tâm đồng bộ: tiến trình, lịch, Desktop/Cloud, nhật ký |
| `/app/billing` | Thẻ thành viên, chọn thời hạn, 3 gói, so sánh, checkout 3 bước (QR minh hoạ, mã giảm giá `IHX10`) |
| `/app/account` | Hồ sơ, đổi mật khẩu, 2FA, thiết bị, thông báo |

Phím tắt: `⌘K` / `/` mở command palette, `⌘J` đồng bộ ngay, `⌘B` thu gọn menu.

Tham số thuế (giảm trừ gia cảnh, biểu thuế TNCN, ngưỡng 5 triệu…) nằm ở `src/lib/accounting.ts` → `TAX_CONFIG`. Có chế độ sáng/tối.

## Chạy local

```bash
npm install
npm run dev
```

## Deploy GitHub Pages

Workflow `.github/workflows/deploy.yml` tự build (`output: 'export'`) và deploy khi push. Bật **Settings → Pages → Source: GitHub Actions** cho repo.
