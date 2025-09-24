"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { HelpCircle, Car, User, HardDrive, Calendar, Radio, Phone, LayoutGrid, Mic, MicOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImageZoom } from "@/components/ui/image-zoom"
import Image from "next/image"
import { cn } from "@/lib/utils"

interface HelpPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const HelpContent = ({ onImageZoomChange }: { onImageZoomChange: (zoomed: boolean) => void }) => (
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
        <p>Quản lý thông tin về các thiết bị phần cứng được sử dụng trong hệ thống.</p>
        <h4>Các chức năng chính:</h4>
        <ul>
          <li><strong>Thêm thiết bị mới:</strong> Nhập thông tin cho thiết bị. Lưu ý, trường <strong>Device No</strong> là mã số định danh duy nhất được in trên thân của mỗi thiết bị body cam.</li>
          <li><strong>Cập nhật thông tin:</strong> Chỉnh sửa thông tin của một thiết bị đã có.</li>
          <li><strong>Xóa thiết bị:</strong> Loại bỏ một thiết bị khỏi hệ thống.</li>
          <li>
            <strong>Gán và hủy gán thiết bị:</strong> Mặc định, một thiết bị mới tạo sẽ ở trạng thái "Chưa gán". Để gán, bạn vào menu Thao tác và chọn "Gán xe". Một danh sách các xe chưa được gán thiết bị sẽ hiện ra để bạn lựa chọn. Tương tự, bạn cũng có thể chọn "Hủy gán" để gỡ thiết bị khỏi xe hiện tại.
          </li>
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
        <p>
          Tính năng "Ca làm việc" là công cụ trung tâm để ghi lại và quản lý toàn bộ hành trình của một xe trong một phiên làm việc, bao gồm lộ trình GPS chi tiết và video được ghi lại từ camera.
        </p>
        <ol className="list-decimal list-inside space-y-4">
          <li>
            <strong>Danh sách ca làm việc</strong>
            <p className="!mt-1">Đây là nơi bạn quản lý toàn bộ các phiên làm việc. Từ đây bạn có thể tạo, bắt đầu, kết thúc và xem lại hành trình của một ca.</p>
            <ul className="list-disc list-inside space-y-3 pl-4 !mt-2">
              <li>
                <strong>Tạo ca làm việc mới:</strong>
                <p className="!mt-1">Nhấn nút "Tạo ca làm việc" để mở form. Bạn cần điền các thông tin sau:</p>
                <ul className="list-['-_'] list-inside space-y-1 pl-4 !mt-1">
                  <li><strong>Xe & Tài xế:</strong> Chọn xe và tài xế có sẵn (hệ thống sẽ tự động lọc những xe/tài xế đang bận).</li>
                  <li><strong>Thời gian bắt đầu & kết thúc:</strong> Chọn khung thời gian dự kiến cho ca làm việc.</li>
                  <li><strong>Ghi chú:</strong> Thêm ghi chú nếu cần thiết.</li>
                </ul>
              </li>
              <li>
                <strong>Các trạng thái của ca:</strong>
                <ul className="list-['-_'] list-inside space-y-1 pl-4 !mt-1">
                  <li><strong>Chờ bắt đầu:</strong> Là trạng thái mặc định sau khi tạo. Để bắt đầu, bạn hãy nhấn vào menu Thao tác (biểu tượng 3 chấm) và chọn 'Bắt đầu'.</li>
                  <li>
                    <strong>Đang hoạt động:</strong> Hệ thống đang ghi lại GPS và video. Để kết thúc sớm, bạn chọn 'Kết thúc' trong menu Thao tác. Mặc định khi quá thời gian, hệ thống sẽ thúc ca làm việc.
                    <div className="prose prose-sm max-w-none my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <p className="!mt-0 !mb-2 font-semibold text-amber-800">Lưu ý quan trọng:</p>
                      <p className="!m-0">Để video hành trình được ghi lại và đồng bộ lên hệ thống, khi bắt đầu ca làm việc vui lòng <strong>nhấn nút màu đỏ</strong> ở phía trên của thiết bị.</p>
                      <ImageZoom
                        onZoomChange={onImageZoomChange}
                        backdropClassName={cn(
                        '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                      )}>
                        <Image
                          src="/images/stream.png"
                          alt="Live"
                          className="mx-auto my-2 rounded-md border w-[100px]"
                          width={100}
                          height={100}
                          unoptimized
                        />
                      </ImageZoom>
                    </div>
                  </li>
                  <li><strong>Đã hoàn thành:</strong> Là trạng thái cuối cùng sau khi ca làm việc kết thúc. Khi hành trình ở trạng thái này, dữ liệu GPS và video không còn được lưu nữa.</li>
                </ul>
              </li>
            </ul>
          </li>
          <li>
            <strong>Xem lại hành trình (Playback)</strong>
            <p className="!mt-1">Bạn có thể xem lại hành trình khi ca ở trạng thái "Đang hoạt động" hoặc "Đã hoàn thành". Từ menu Thao tác, chọn 'Xem hành trình' để truy cập màn hình phát lại. Màn hình này cho phép bạn tái hiện lại toàn bộ chuyến đi với các chức năng:</p>
            <ul className="list-disc list-inside space-y-2 pl-4 !mt-2">
              <li>
                <strong>Đồng bộ hóa Dữ liệu:</strong> Video, vị trí trên bản đồ, và nhật ký di chuyển được đồng bộ hóa chính xác theo thời gian.
              </li>
              <li>
                <strong>Thanh trượt thời gian:</strong> Kéo để tua đến một thời điểm bất kỳ trong hành trình.
              </li>
              <li>
                <strong>Điều khiển tốc độ:</strong> Thay đổi tốc độ phát lại (tua nhanh, phát chậm).
              </li>
              <li>
                <strong>Bản đồ tương tác:</strong> Vị trí xe di chuyển tương ứng trên bản đồ khi xem lại.
              </li>
            </ul>
          </li>
        </ol>
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
        <p>Màn hình Live là trung tâm chỉ huy, cho phép giám sát và tương tác với đội xe theo thời gian thực. Các chức năng được tích hợp chặt chẽ giữa danh sách phương tiện bên trái và bản đồ bên phải.</p>

        <h4>Các chức năng chính:</h4>
        <ol className="list-decimal list-inside space-y-2">
          <li>
            <strong>Theo dõi vị trí (GPS Tracking):</strong>
            <ul className="list-disc list-inside pl-4 !mt-1">
              <li>Bản đồ bên phải hiển thị vị trí của tất cả các xe đang hoạt động.</li>
              <li>Khi bạn chọn một xe từ danh sách bên trái, bản đồ sẽ tự động di chuyển và phóng to vào vị trí của xe đó.</li>
            </ul>
          </li>
          <li>
            <strong>Xem Video trực tiếp (Live Stream):</strong>
            <ul className="list-disc list-inside pl-4 !mt-1">
              <li>Trên thẻ thông tin của mỗi xe ở danh sách bên trái, nhấn vào khu vực ảnh thumbnail để bắt đầu xem video trực tiếp từ camera.</li>
              <li>Trình xem video có các nút điều khiển để dừng hoặc xem toàn màn hình.</li>
            </ul>
          </li>
          <li>
            <strong>Đàm thoại hai chiều (Two-way Audio):</strong>
            <div className="prose prose-sm max-w-none my-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="!mt-0 !mb-2 font-semibold text-blue-800">Lưu ý quan trọng:</p>
              <p className="!m-0">Để giao tiếp được, bạn cần vào <strong>Cài đặt &gt; Gọi nhóm &gt; chọn nhóm là "Elcom Group"</strong> trên thiết bị bodycamera.</p>
              <ImageZoom
                onZoomChange={onImageZoomChange}
                backdropClassName={cn(
                  '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
                )}>
                <Image
                  src="/images/group.png"
                  alt="Hướng dẫn cài đặt nhóm"
                  className="mx-auto my-2 rounded-md border w-[50px]"
                  width={50}
                  height={50}
                  unoptimized
                />
              </ImageZoom>
            </div>
            <p className="!mt-4">Hệ thống hỗ trợ hai chế độ đàm thoại:</p>
            <ul className="list-disc list-inside pl-4 !mt-1 space-y-2">
              <li>
                <strong>Gọi riêng:</strong> Nhấn vào biểu tượng <Phone className="inline h-4 w-4 text-blue-500" /> trên thẻ xe để bắt đầu cuộc gọi thoại riêng tư với tài xế đó.
              </li>
              <li>
                <strong>Giao tiếp nhóm (Talkgroup):</strong> Sử dụng các nút
                <Button size="sm" className="bg-green-500 hover:bg-green-600 mx-1 h-6 text-xs">
                  <Mic className="h-3 w-3 mr-1" />
                  Nói
                </Button>
                và
                <Button size="sm" variant="destructive" className="mx-1 h-6 text-xs">
                  <MicOff className="h-3 w-3 mr-1" />
                  Dừng
                </Button>
                ở đầu danh sách để nói chuyện với tất cả tài xế trong ca làm việc cùng một lúc.
              </li>
            </ul>
            <div className="prose prose-sm max-w-none my-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="!mt-0 !mb-2 font-semibold text-amber-800">Đàm thoại trên thiết bị:</p>
              <p className="!m-0">Để nói chuyện trực tiếp từ bodycam, vui lòng <strong>nhấn và giữ nút màu vàng</strong> ở cạnh bên phải của thiết bị.</p>
              <ImageZoom
                onZoomChange={onImageZoomChange}
                backdropClassName={cn(
                '[&_[data-rmiz-modal-overlay="visible"]]:bg-black/80'
              )}>
                <Image
                  src="/images/mic.png"
                  alt="Nút PTT trên bodycam"
                  className="mx-auto my-2 rounded-md border w-[50px]"
                  width={50}
                  height={50}
                  unoptimized
                />
              </ImageZoom>
            </div>
          </li>
        </ol>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
)

export function HelpPanel({ open, onOpenChange }: HelpPanelProps) {
  const [isImageZoomed, setIsImageZoomed] = useState(false)

  const handleImageZoomChange = (zoomed: boolean) => {
    setIsImageZoomed(zoomed)
  }

  const handleInteractOutside = (event: Event) => {
    if (isImageZoomed) {
      event.preventDefault()
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        className="sm:max-w-2xl w-full overflow-y-auto"
        onInteractOutside={handleInteractOutside}
        onEscapeKeyDown={handleInteractOutside}
      >
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center gap-3 text-2xl">
            <HelpCircle className="h-7 w-7" />
            <span>Trung tâm Trợ giúp</span>
          </SheetTitle>
          <SheetDescription>
            Tìm kiếm hướng dẫn và giải đáp thắc mắc về các tính năng của hệ thống.
          </SheetDescription>
        </SheetHeader>
        <HelpContent onImageZoomChange={handleImageZoomChange} />
      </SheetContent>
    </Sheet>
  )
}

