# Tổng quan Chức năng và Kỹ thuật - Màn hình Chi tiết Hành trình

Tài liệu này tóm tắt các chức năng chính, công nghệ và các giải pháp kỹ thuật quan trọng được sử dụng trong màn hình chi tiết lịch sử hành trình.

## 1. Chức năng chính

### a. Tái hiện Hành trình (Journey Replay)

- **Đồng bộ Video, GPS và Nhật ký**: Video, vị trí xe trên bản đồ, và danh sách nhật ký di chuyển được đồng bộ hóa thông qua một state `globalTime` (tính bằng giây). Khi `globalTime` thay đổi, các `useEffect` hook sẽ tính toán lại vị trí GPS tương ứng và video đang hoạt động.

  ```tsx
  // Tìm chỉ mục GPS gần nhất với thời gian hiện tại
  useEffect(() => {
    if (!historyData?.data.length || !journeyStartTimeMs) return
    const currentElapsedTimeMs = globalTime * 1000
    const targetTimeMs = journeyStartTimeMs + currentElapsedTimeMs
    const closestGpsIndex = historyData.data.reduce((closest, point, index) => {
      const pointTime = new Date(point.collected_at).getTime()
      const closestTime = new Date(historyData.data[closest].collected_at).getTime()
      return Math.abs(pointTime - targetTimeMs) < Math.abs(closestTime - targetTimeMs) ? index : closest
    }, 0)
    setCurrentGpsIndex(closestGpsIndex)
  }, [globalTime, historyData, journeyStartTimeMs])
  ```

- **Virtualization (Ảo hóa) cho Nhật ký di chuyển**: Để xử lý hiệu quả hàng nghìn điểm dữ liệu GPS, danh sách nhật ký sử dụng thư viện `@tanstack/react-virtual`. Thư viện này chỉ render các mục đang hiển thị trong viewport, giúp duy trì hiệu năng cao.

  ```tsx
  const parentRef = useRef<HTMLDivElement>(null)
  const rowVirtualizer = useVirtualizer({
    count: historyData?.data.length ?? 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // Chiều cao ước tính của một mục
    overscan: 5,
  });
  ```

### b. Lọc theo Khoảng thời gian (Timeline Filter)

Đây là chức năng phức tạp nhất, được xây dựng tùy chỉnh để giải quyết các hạn chế của component `Slider` mặc định.

- **Cấu trúc**: Sử dụng hai thẻ `<input type="range">` được xếp chồng lên nhau bằng CSS (`position: absolute`). Một `div` khác được dùng để hiển thị vùng đã chọn (range highlight).

- **Xử lý tương tác chồng chéo**: Vấn đề lớn nhất là thẻ input ở trên sẽ chặn tương tác với thẻ ở dưới. Giải pháp cuối cùng và hiệu quả nhất là:
    1.  Đặt `input` của con trỏ **phải** (`timeRange[1]`) ở lớp trên (`z-index: 4`).
    2.  Đặt `input` của con trỏ **trái** (`timeRange[0]`) ở lớp dưới (`z-index: 3`).
    3.  Thêm `pointer-events-none` vào `input` ở lớp trên để sự kiện click có thể "xuyên qua" phần rãnh trượt (track).
    4.  Kích hoạt lại sự kiện chỉ cho con trỏ (thumb) của `input` đó bằng `[&::-webkit-slider-thumb]:pointer-events-auto`.

  ```tsx
  {/* Invisible range inputs */}
  <input
    type="range"
    min={0}
    max={totalDuration}
    value={timeRange[0]} // Con trỏ trái
    onChange={/* ... */}
    className="absolute w-full h-full opacity-0 cursor-pointer"
    style={{ zIndex: 3 }}
  />
  <input
    type="range"
    min={0}
    max={totalDuration}
    value={timeRange[1]} // Con trỏ phải
    onChange={/* ... */}
    className="absolute w-full h-full opacity-0 cursor-pointer pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-moz-range-thumb]:pointer-events-auto"
    style={{ zIndex: 4 }}
  />
  ```

- **Logic cập nhật giá trị**: `onChange` của mỗi input được thiết kế để đảm bảo hai con trỏ không thể vượt qua nhau.

  ```tsx
  // Con trỏ trái
  onChange={(e) => {
    const newStart = Number(e.target.value);
    if (newStart < timeRange[1]) { // Đảm bảo không vượt qua con trỏ phải
      setTimeRange([newStart, timeRange[1]]);
    }
  }}

  // Con trỏ phải
  onChange={(e) => {
    const newEnd = Number(e.target.value);
    if (newEnd > timeRange[0]) { // Đảm bảo không vượt qua con trỏ trái
      setTimeRange([timeRange[0], newEnd]);
    }
  }}
  ```

## 2. Ngăn xếp Công nghệ (Tech Stack)

- **Framework**: Next.js (React)
- **Ngôn ngữ**: TypeScript
- **UI**: `shadcn/ui`, Tailwind CSS, `lucide-react`
- **Quản lý trạng thái**: React Hooks (`useState`, `useEffect`, `useMemo`, `useRef`)
- **Hiệu năng**: `@tanstack/react-virtual`
- **API**: `journeySessionsAPI` (module tùy chỉnh)
- **Thông báo**: `sonner`

