"use client"

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Car, User, HardDrive, Calendar, Radio, Phone, LayoutGrid, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpContent = () => (
  <Accordion type="single" collapsible className="w-full">
    {/* System Overview */}
    <AccordionItem value="overview">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-indigo-500" />
          <span className="font-semibold text-base">Tổng quan hệ thống</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Hệ thống Fleet Management cung cấp một nền tảng hợp nhất để quản lý, giám sát và điều hành đội xe hiệu quả.</p>
        <h4>Luồng hoạt động chuẩn:</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>Bước 1: Khởi tạo dữ liệu nền</strong>
            <p className="!mt-1">Quản lý viên cần nhập thông tin ban đầu vào các module `Quản lý xe`, `Quản lý tài xế`, và `Quản lý thiết bị`.</p>
          </li>
          <li>
            <strong>Bước 2: Phân công công việc</strong>
            <p className="!mt-1">Sử dụng module `Ca làm việc` để tạo các phiên làm việc, gán tài xế và xe cho một khung thời gian cụ thể.</p>
          </li>
          <li>
            <strong>Bước 3: Giám sát thời gian thực</strong>
            <p className="!mt-1">Truy cập module `Live` để theo dõi vị trí, trạng thái, xem video và giao tiếp trực tiếp với tài xế đang trong ca làm việc.</p>
          </li>
        </ol>
      </AccordionContent>
    </AccordionItem>

    {/* Vehicle Management */}
    <AccordionItem value="vehicle">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <Car className="h-5 w-5 text-green-500" />
          <span className="font-semibold text-base">Quản lý xe</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Quản lý toàn bộ thông tin về các phương tiện trong đội xe của bạn.</p>
        <h4>Các chức năng chính:</h4>
        <ul>
          <li><strong>Thêm xe mới:</strong> Nhập các thông tin cần thiết như biển số, loại xe, tải trọng.</li>
          <li><strong>Cập nhật thông tin:</strong> Chỉnh sửa thông tin của xe hiện có.</li>
          <li><strong>Xóa xe:</strong> Loại bỏ xe khỏi hệ thống (lưu ý các dữ liệu lịch sử có thể bị ảnh hưởng).</li>
        </ul>
      </AccordionContent>
    </AccordionItem>

    {/* Driver Management */}
    <AccordionItem value="driver">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <User className="h-5 w-5 text-purple-500" />
          <span className="font-semibold text-base">Quản lý tài xế</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Quản lý thông tin cá nhân và liên lạc của các tài xế.</p>
        <h4>Các chức năng chính:</h4>
        <ul>
          <li><strong>Thêm tài xế mới:</strong> Nhập họ tên, số điện thoại, giấy phép lái xe.</li>
          <li><strong>Cập nhật thông tin:</strong> Chỉnh sửa thông tin cá nhân của tài xế.</li>
          <li><strong>Vô hiệu hóa tài khoản:</strong> Tạm khóa tài khoản khi tài xế nghỉ việc.</li>
        </ul>
      </AccordionContent>
    </AccordionItem>

    {/* Device Management */}
    <AccordionItem value="device">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <HardDrive className="h-5 w-5 text-orange-500" />
          <span className="font-semibold text-base">Quản lý thiết bị</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Quản lý các thiết bị phần cứng được lắp đặt trên xe.</p>
        <h4>Các chức năng chính:</h4>
        <ul>
          <li><strong>Xem danh sách thiết bị:</strong> Liệt kê tất cả các thiết bị OBU, camera. Tại đây, bạn sẽ thấy cột <strong>Device No</strong>, đây chính là mã số định danh được in trên thân của mỗi thiết bị body cam.</li>
          <li><strong>Gán thiết bị cho xe:</strong> Chỉnh sửa một thiết bị và chọn xe tương ứng để liên kết chúng với nhau. Đây là bước quan trọng để dữ liệu từ thiết bị được hiển thị đúng trên bản đồ giám sát.</li>
          {/* <li><strong>Kiểm tra trạng thái:</strong> Xem thiết bị đang được gán cho xe nào và trạng thái hoạt động của nó.</li> */}
        </ul>
      </AccordionContent>
    </AccordionItem>

    {/* Shift Management */}
    <AccordionItem value="shift">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-red-500" />
          <span className="font-semibold text-base">Ca làm việc</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Phân công và quản lý ca làm việc cho tài xế và xe.</p>
        <h4>Các chức năng chính:</h4>
        <ul>
          <li><strong>Tạo ca làm việc:</strong> Chọn tài xế, xe và khung thời gian làm việc.</li>
          <li><strong>Xem lịch làm việc:</strong> Hiển thị lịch làm việc của đội xe theo tuần hoặc tháng.</li>
          <li><strong>Chấm công:</strong> Ghi nhận thời gian bắt đầu và kết thúc ca làm việc của tài xế.</li>
        </ul>
      </AccordionContent>
    </AccordionItem>

    {/* Live Module */}
    <AccordionItem value="live">
      <AccordionTrigger>
        <div className="flex items-center gap-3">
          <Radio className="h-5 w-5 text-blue-500" />
          <span className="font-semibold text-base">Live</span>
        </div>
      </AccordionTrigger>
      <AccordionContent className="prose prose-sm max-w-none pl-11 text-gray-600">
        <p>Màn hình Live là trung tâm chỉ huy, cho phép giám sát và tương tác với đội xe theo thời gian thực thông qua giao diện hai cột trực quan.</p>

        <h4>Cột bên trái: Danh sách thiết bị</h4>
        <p>Hiển thị các thẻ thông tin cho mỗi thiết bị đang hoạt động. Mỗi thẻ bao gồm:</p>
        <ul>
            <li><strong>Tên tài xế và Trạng thái:</strong> Chấm màu cho biết trạng thái (Xanh: Online, Cam: Mất GPS, Đỏ: Offline).</li>
            <li><strong>Xem Video Trực Tiếp:</strong> Nhấn vào ảnh thumbnail để xem luồng video trực tiếp từ camera của thiết bị.</li>
            <li><strong>Gọi riêng:</strong> Nhấn vào biểu tượng điện thoại <Phone className="inline h-4 w-4 text-blue-500" /> để bắt đầu cuộc gọi thoại riêng tư với tài xế đó.</li>
            <li><strong>Giao tiếp nhóm (Push-to-Talk):</strong> Sử dụng nút
              <Button size="sm" className="bg-green-500 hover:bg-green-600 mx-1 h-6 text-xs">
                <Mic className="h-3 w-3 mr-1" />
                Nói
              </Button>
              <Button size="sm" variant="destructive" className="mx-1 h-6 text-xs">
                <MicOff className="h-3 w-3 mr-1" />
                Dừng
              </Button>
              ở phía trên để liên lạc cho toàn bộ nhóm.
            </li>
            <li><strong>Chỉ báo đang nói:</strong> Khi một thành viên đang nói, thẻ của họ sẽ có viền đỏ và hiệu ứng rung để dễ dàng nhận biết.</li>
        </ul>

        <h4>Cột bên phải: Bản đồ thời gian thực</h4>
        <p>Hiển thị vị trí của tất cả các thiết bị trên bản đồ số.</p>
        <ul>
            <li><strong>Biểu tượng xe:</strong> Mỗi xe được đại diện bằng một biểu tượng trên bản đồ.</li>
            <li><strong>Thông tin chi tiết:</strong> Nhấn vào biểu tượng xe trên bản đồ để xem một cửa sổ pop-up chứa thông tin chi tiết như trạng thái, tọa độ, tốc độ, và biển số xe.</li>
        </ul>
        <ul>
            <li>Khi bạn <strong>nhấn vào một thẻ thiết bị bất kỳ ở cột bên trái</strong>, bản đồ ở cột bên phải sẽ tự động <strong>di chuyển (fly to) và phóng to</strong> vào đúng vị trí của thiết bị đó.</li>
            <li>Đồng thời, tiêu đề phía trên bản đồ cũng cập nhật để cho biết bạn đang xem chi tiết thiết bị nào.</li>
        </ul>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg w-full overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <HelpCircle className="h-7 w-7" />
            <span>Trung tâm Trợ giúp</span>
          </SheetTitle>
          <SheetDescription>
            Tìm kiếm hướng dẫn và giải đáp thắc mắc về các tính năng của hệ thống.
          </SheetDescription>
        </SheetHeader>
        <HelpContent />
      </SheetContent>
    </Sheet>
  )
}

