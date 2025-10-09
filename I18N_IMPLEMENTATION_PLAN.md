# Kế hoạch Triển khai Đa ngôn ngữ (i18n) - Cập nhật

Dựa trên các yêu cầu mới (không thay đổi URL, không thay đổi cấu trúc thư mục `app`), kế hoạch được cập nhật để sử dụng `react-i18next`.

## 1. Phân tích và Yêu cầu

- **Ràng buộc**:
    1.  Không thay đổi cấu trúc URL (không thêm `/:locale`).
    2.  Không thay đổi cấu trúc thư mục `app` (không dùng `app/[locale]`).
- **Mục tiêu**: Triển khai i18n phía client, quản lý ngôn ngữ qua React Context và lưu lựa chọn vào `localStorage`.

## 2. Công nghệ và Thư viện Đề xuất

- **Thư viện chính**: `react-i18next` và `i18next`.
- **Plugin phát hiện ngôn ngữ**: `i18next-browser-languagedetector` để tự động phát hiện ngôn ngữ từ trình duyệt hoặc `localStorage`.
- **Lý do**: Bộ công cụ này rất linh hoạt, không phụ thuộc vào routing, và hoàn toàn phù hợp với việc quản lý trạng thái ngôn ngữ phía client trong Next.js App Router.

## 3. Tổ chức Thư mục File Ngôn ngữ

Cấu trúc thư mục `locales` vẫn được giữ nguyên. Mỗi ngôn ngữ sẽ có một file JSON riêng, nhưng nội dung sẽ được cấu trúc lại để dễ quản lý hơn.

```
/
|-- locales/
|   |-- en.json
|   |-- vi.json
|-- app/
|-- ...
```

**Cấu trúc file `en.json` (ví dụ):**
```json
{
  "common": {
    "login": "Login",
    "logout": "Logout",
    "loading": "Loading..."
  },
  "loginPage": {
    "title": "Fleet Management",
    "description": "System for managing and tracking vehicles via OBU devices",
    "usernameLabel": "Username",
    "passwordLabel": "Password",
    "demoCredentials": "Demo: admin / admin"
  }
}
```

## 4. Quản lý Trạng thái Ngôn ngữ

- **React Context**: Tạo một `LanguageProvider` để cung cấp `i18n instance` và trạng thái ngôn ngữ cho toàn bộ ứng dụng. Provider này sẽ được đặt trong `app/layout.tsx`.
- **`localStorage`**: Sử dụng `i18next-browser-languagedetector` để tự động lưu và đọc ngôn ngữ người dùng đã chọn từ `localStorage`. Điều này giúp giữ nguyên lựa chọn ngôn ngữ giữa các phiên làm việc.
- **Không phụ thuộc URL**: Ngôn ngữ sẽ được thay đổi mà không cần tải lại trang hay thay đổi URL.

## 5. Giao diện Chọn Ngôn ngữ

- **Component**: Tạo một component `LanguageSwitcher.tsx` (client component) sử dụng hook `useTranslation` từ `react-i18next`.
- **Chức năng**: Component này sẽ hiển thị ngôn ngữ hiện tại và cho phép người dùng chọn một ngôn ngữ khác từ danh sách (ví dụ: dropdown). Khi một ngôn ngữ mới được chọn, nó sẽ gọi hàm `i18n.changeLanguage('new_lang')`.
- **Vị trí**: Đặt component này trong `Header` hoặc một vị trí phù hợp khác.

## 6. Các Bước Triển khai Chi tiết

1.  **Cài đặt thư viện**: Cài đặt `react-i18next`, `i18next`, và `i18next-browser-languagedetector`.
2.  **Tạo file cấu hình i18n**: Tạo một file `lib/i18n.ts` để khởi tạo và cấu hình `i18next` với các plugin cần thiết.
3.  **Tạo Provider Ngôn ngữ**: Tạo một `LanguageProvider` (`components/providers/language-provider.tsx`) để bọc các component con và cung cấp context i18n.
4.  **Cập nhật Layout Gốc**: Trong `app/layout.tsx`, bọc `{children}` bằng `LanguageProvider` vừa tạo.
5.  **Tạo các file dịch**: Tạo và điền nội dung cho `locales/en.json` và `locales/vi.json`.
6.  **Tạo Component Chọn Ngôn ngữ**: Xây dựng component `LanguageSwitcher.tsx`.
7.  **Tích hợp dịch thuật**: Refactor các component hiện có (ví dụ: `app/page.tsx`), thay thế các chuỗi văn bản tĩnh bằng hàm `t()` từ hook `useTranslation`.
8.  **Kiểm tra**: Chạy ứng dụng và kiểm tra chức năng chuyển đổi ngôn ngữ, đảm bảo các bản dịch được cập nhật chính xác.
