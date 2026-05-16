# design.md — Website bài tập Gym cho Nam/Nữ mới tập

## 1. Tổng quan sản phẩm

Website là nền tảng hướng dẫn tập gym cho người mới, xây dựng bằng **Next.js**, tập trung vào 2 nhóm người dùng chính:

1. **Nữ mới tập cần giảm cân**
2. **Nam mới tập tăng cơ nền tảng**

Website cung cấp:
- Lịch tập 5 buổi/tuần
- Danh sách bài tập chi tiết
- Mô tả cách tập bằng tiếng Việt
- Nhóm cơ tác động
- Số hiệp, số reps, thời gian nghỉ
- Cardio phù hợp
- Hình ảnh hoặc video minh họa
- Bộ lọc theo giới tính, mục tiêu, nhóm cơ, thiết bị
- Theo dõi tiến độ tập luyện

---

## 2. Mục tiêu website

### Mục tiêu chính
- Giúp người mới biết hôm nay tập gì
- Hiểu rõ từng bài tập trước khi vào phòng gym
- Tránh tập sai form
- Có lộ trình rõ ràng trong 5 buổi/tuần
- Tạo trải nghiệm dễ dùng trên điện thoại tại phòng gym

### Mục tiêu phụ
- Có thể mở rộng thành app fitness cá nhân
- Có thể tích hợp video từ YouTube hoặc API bài tập
- Có thể thêm tài khoản người dùng, tracking, lịch sử tập
- Có thể phát triển thành sản phẩm SaaS cho PT/phòng gym

---

## 3. Đối tượng người dùng

### 3.1. Nữ mới tập cần giảm cân
Nhu cầu:
- Giảm mỡ
- Săn chắc chân, mông, tay
- Không muốn tập quá nặng
- Cần hướng dẫn dễ hiểu
- Cần cardio sau buổi tập

Nội dung ưu tiên:
- Lower Body
- Glute Focus
- Full Body đốt mỡ
- Cardio
- Core

### 3.2. Nam mới tập
Nhu cầu:
- Tăng cơ nền tảng
- Vai rộng, ngực dày, lưng khỏe
- Tập đúng kỹ thuật compound cơ bản
- Biết cách tăng tạ dần

Nội dung ưu tiên:
- Push
- Pull
- Legs
- Upper Body
- Full Body strength

---

## 4. Tech Stack đề xuất

### Frontend
- Next.js App Router
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- Lucide Icons

### Full-stack với Next.js
Next.js đóng vai trò **vừa là client vừa là server**:

#### Client side
- React Server Components cho phần đọc dữ liệu mặc định
- Client Components cho các phần cần tương tác:
  - Checklist bài tập
  - Timer nghỉ giữa hiệp
  - Form ghi cân nặng/số đo
  - Dashboard biểu đồ
  - To-do từng ngày ( với từng User)
- Zustand hoặc React Context cho state ngắn hạn trên trình duyệt
- localStorage chỉ dùng cho trạng thái tạm thời nếu người dùng chưa đăng nhập

#### Server side
- Next.js App Router
- Server Components để fetch dữ liệu trực tiếp từ database
- Server Actions cho thao tác đơn giản:
  - Tick hoàn thành bài tập
  - Ghi reps/weight
  - Cập nhật to-do
  - Lưu đánh giá ngày
- Route Handlers trong `/app/api/*` cho API cần dùng ở client hoặc mobile app sau này
- Middleware bảo vệ route người dùng và admin

### Database
- MongoDB Atlas hoặc MongoDB self-hosted
- Mongoose ODM
- ObjectId làm khóa chính
- Dữ liệu dạng document phù hợp với:
  - Giáo án gồm nhiều buổi
  - Buổi tập gồm nhiều bài
  - Log tập luyện từng ngày
  - To-do/checklist theo ngày
  - Tổng kết theo tháng

### Authentication
- Dùng Clerk
- JWT session hoặc MongoDB adapter

### Media
- Cloudinary hoặc ImageKit cho ảnh bài tập tự upload
- YouTube Embed cho video hướng dẫn
- API bài tập bên thứ ba nếu cần dữ liệu mẫu

### Deployment
- Vercel cho frontend/backend Next.js
- MongoDB Atlas cho database
- Cloudinary cho media
- Vercel Cron Jobs nếu cần tự động tạo daily task hoặc monthly review

---

## 5. Cấu trúc sitemap

```txt
/
/giao-an
/giao-an/nu-giam-can
/giao-an/nam-moi-tap
/bai-tap
/bai-tap/[slug]
/nhom-co
/nhom-co/[muscle]
/lich-tap
/hom-nay
/todo
/tong-ket-thang
/tien-do
/yeu-thich
/dinh-duong
/admin
/admin/exercises
/admin/workout-plans
/admin/media
```

---

## 6. Cấu trúc trang chính

## 6.1. Trang chủ `/`

### Mục tiêu
Giới thiệu nhanh website và điều hướng người dùng vào đúng giáo án.

### Thành phần giao diện
- Hero section
- CTA chọn mục tiêu:
  - Nữ mới tập cần giảm cân
  - Nam mới tập
- Tổng quan lịch 5 buổi/tuần
- Danh mục nhóm cơ
- Bài tập phổ biến
- Video hướng dẫn nổi bật

### CTA chính
- “Xem giáo án nữ giảm cân”
- “Xem giáo án nam mới tập”
- “Khám phá bài tập”

---

## 6.2. Trang giáo án `/giao-an`

### Chức năng
Hiển thị tất cả giáo án hiện có.

### Bộ lọc
- Giới tính
- Mục tiêu
- Số buổi/tuần
- Cấp độ

### Card giáo án
Mỗi card gồm:
- Tên giáo án
- Mục tiêu
- Số buổi/tuần
- Cấp độ
- Thời lượng mỗi buổi
- Nút xem chi tiết

---

## 6.3. Trang giáo án nữ giảm cân `/giao-an/nu-giam-can`

### Nội dung
Lịch 5 buổi/tuần:

#### Buổi 1 — Chân + Mông + Cardio
- Goblet Squat
- Leg Press
- Walking Lunge
- Hip Thrust
- Plank
- Cardio đi bộ dốc

#### Buổi 2 — Lưng + Vai + Tay
- Lat Pulldown
- Seated Cable Row
- Dumbbell Shoulder Press
- Dumbbell Lateral Raise
- Tricep Pushdown
- Bicep Curl
- Cardio đạp xe hoặc stairmaster

#### Buổi 3 — Mông + Đùi sau + Bụng
- Romanian Deadlift
- Bulgarian Split Squat
- Cable Kickback
- Hip Abduction Machine
- Russian Twist
- Cardio đi bộ dốc

#### Buổi 4 — Full Upper Body
- Chest Press Machine
- Assisted Pull Up
- Dumbbell Row
- Face Pull
- Mountain Climber
- Stairmaster

#### Buổi 5 — Full Body đốt mỡ
- Squat
- Push Up gối
- Dumbbell Deadlift
- Jump Rope
- Plank

### UI
- Tabs theo từng buổi
- Progress checklist
- Nút “Đánh dấu đã tập”
- Nút “Xem mô tả bài tập”
- Nút “Xem video hướng dẫn”

---

## 6.4. Trang giáo án nam mới tập `/giao-an/nam-moi-tap`

### Nội dung
Lịch 5 buổi/tuần:

#### Buổi 1 — Push
- Bench Press
- Incline Dumbbell Press
- Shoulder Press
- Dumbbell Lateral Raise
- Tricep Pushdown
- Push Up

#### Buổi 2 — Pull
- Lat Pulldown
- Barbell Row
- Seated Cable Row
- Face Pull
- Dumbbell Curl
- Hammer Curl

#### Buổi 3 — Legs
- Squat
- Romanian Deadlift
- Leg Press
- Walking Lunge
- Calf Raise

#### Buổi 4 — Upper Body
- Incline Bench Press
- Assisted Pull Up
- Dumbbell Shoulder Press
- Dumbbell Row
- Lateral Raise
- Cable Curl

#### Buổi 5 — Full Body + Cardio
- Deadlift
- Push Up
- Kettlebell Swing
- Plank
- Battle Rope
- Cardio đi bộ dốc

### UI
- Accordion từng buổi
- Bảng bài tập
- Badge nhóm cơ
- Nút bắt đầu buổi tập
- Timer nghỉ giữa hiệp

---

## 6.5. Trang danh sách bài tập `/bai-tap`

### Chức năng
Hiển thị thư viện tất cả bài tập gym.

### Bộ lọc
- Nhóm cơ:
  - Ngực
  - Lưng
  - Vai
  - Tay trước
  - Tay sau
  - Bụng
  - Mông
  - Đùi trước
  - Đùi sau
  - Bắp chuối
- Thiết bị:
  - Dumbbell
  - Barbell
  - Cable
  - Machine
  - Bodyweight
  - Kettlebell
- Mục tiêu:
  - Giảm cân
  - Tăng cơ
  - Săn chắc
  - Tăng sức mạnh
- Độ khó:
  - Người mới
  - Trung cấp
  - Nâng cao

### Card bài tập
Mỗi card gồm:
- Tên bài tập
- Ảnh/GIF/video preview
- Nhóm cơ chính
- Thiết bị
- Độ khó
- Nút xem chi tiết

---

## 6.6. Trang chi tiết bài tập `/bai-tap/[slug]`

### Nội dung
- Tên bài tập
- Video hoặc ảnh minh họa
- Nhóm cơ tác động
- Thiết bị cần dùng
- Mức độ khó
- Cách tập từng bước
- Lưu ý tránh sai form
- Lỗi thường gặp
- Biến thể dễ hơn
- Biến thể khó hơn
- Bài tập liên quan

### Ví dụ nội dung

#### Goblet Squat
Tác động:
- Đùi trước
- Mông
- Core

Cách tập:
1. Cầm một quả tạ dumbbell trước ngực
2. Đứng hai chân rộng bằng vai
3. Hạ người xuống như ngồi ghế
4. Đẩy gót chân đứng lên

Lưu ý:
- Giữ lưng thẳng
- Gối hướng theo mũi chân
- Không chồm người quá nhiều

---

## 6.7. Trang lịch tập `/lich-tap`

### Chức năng
Người dùng xem lịch theo tuần.

### UI
- Calendar tuần
- Buổi tập hôm nay
- Trạng thái:
  - Chưa tập
  - Đang tập
  - Hoàn thành
  - Bỏ lỡ
- Nút bắt đầu buổi tập

### Lịch mặc định
- Thứ 2: Tập
- Thứ 3: Tập
- Thứ 4: Nghỉ
- Thứ 5: Tập
- Thứ 6: Tập
- Thứ 7: Tập
- Chủ nhật: Nghỉ

---

## 6.8. Trang hôm nay `/hom-nay`

### Mục tiêu
Trang giống dashboard hằng ngày của các app gym/sức khỏe: mở app lên là biết hôm nay cần làm gì.

### Nội dung chính
- Buổi tập hôm nay
- To-do sức khỏe trong ngày
- Lượng nước cần uống
- Mục tiêu bước chân/cardio
- Nhắc ngủ đủ giấc
- Ghi cảm nhận sau tập
- Streak số ngày hoàn thành
- Nút “Bắt đầu buổi tập”
- Nút “Tổng kết ngày”

### Daily to-do mẫu
Mỗi ngày có checklist:

#### Tập luyện
- Hoàn thành buổi tập hôm nay
- Tick từng bài trong buổi tập
- Ghi mức tạ/reps thực tế
- Hoàn thành cardio nếu có

#### Dinh dưỡng
- Uống đủ nước
- Ăn đủ protein
- Hạn chế đồ ngọt/trà sữa
- Không bỏ bữa chính

#### Phục hồi
- Ngủ 7–8 tiếng
- Giãn cơ 5–10 phút
- Ghi mức năng lượng/cảm nhận

### Trạng thái
- Chưa bắt đầu
- Đang làm
- Hoàn thành
- Bỏ lỡ
- Nghỉ chủ động

---

## 6.9. Trang to-do từng ngày `/todo`

### Mục tiêu
Biến giáo án tập luyện thành danh sách việc cần làm mỗi ngày trong 1 tháng.

### Chức năng
- Xem to-do theo ngày
- Tick hoàn thành từng mục
- Ghi note ngắn
- Ghi cân nặng trong ngày
- Ghi số đo theo tuần
- Ghi mood/energy/sleep
- Tự động tính phần trăm hoàn thành ngày
- Hiển thị streak hoàn thành liên tiếp

### Ví dụ to-do ngày tập
- Tập buổi Push hoặc Chân/Mông
- Hoàn thành đủ số bài chính
- Cardio 15–20 phút
- Uống 2–3 lít nước
- Ăn đủ protein
- Ngủ trước 23:30
- Ghi cảm nhận sau tập

### Ví dụ to-do ngày nghỉ
- Đi bộ nhẹ 20–30 phút
- Giãn cơ 10 phút
- Uống đủ nước
- Chuẩn bị bữa ăn cho ngày mai
- Ngủ đủ giấc
- Không ăn quá nhiều đồ ngọt

---

## 6.10. Trang tổng kết tháng `/tong-ket-thang`

### Mục tiêu
Sau 1 tháng, hệ thống tổng hợp dữ liệu để người dùng biết mình tiến bộ như thế nào.

### Chỉ số tổng kết
- Số ngày hoàn thành to-do
- Số buổi tập hoàn thành
- Số buổi bỏ lỡ
- Tỷ lệ hoàn thành trong tháng
- Streak dài nhất
- Cân nặng đầu tháng/cuối tháng
- Thay đổi vòng eo, vòng mông, vòng ngực
- Tổng volume tập luyện
- Bài tập tiến bộ tốt nhất
- Thói quen tốt nhất
- Thói quen cần cải thiện

### Đánh giá tháng
Hệ thống đưa ra nhận xét dạng dễ hiểu:
- “Bạn hoàn thành 18/22 buổi tập.”
- “Tỷ lệ hoàn thành to-do đạt 82%.”
- “Bạn duy trì streak 9 ngày liên tiếp.”
- “Mức tạ Goblet Squat tăng từ 8kg lên 12kg.”
- “Bạn thường bỏ lỡ cardio vào cuối tuần.”

### Gợi ý tháng tiếp theo
- Tăng nhẹ mức tạ nếu hoàn thành tốt
- Giữ nguyên giáo án nếu tỷ lệ hoàn thành dưới 70%
- Thêm cardio nếu mục tiêu giảm cân chưa đạt
- Thêm bài compound nếu mục tiêu tăng cơ tiến triển tốt

---

## 6.11. Trang theo dõi tiến độ `/tien-do`

### Chức năng
- Lưu số buổi đã hoàn thành
- Lưu cân nặng
- Lưu số đo cơ thể
- Lưu mức tạ từng bài
- Theo dõi reps/sets
- Hiển thị biểu đồ tiến bộ

### Chỉ số theo dõi
- Cân nặng
- Vòng eo
- Vòng mông
- Vòng ngực
- Số buổi tập/tuần
- Tổng volume tập luyện

---

## 6.12. Trang yêu thích `/yeu-thich`

### Chức năng
- Lưu bài tập yêu thích
- Lưu giáo án yêu thích
- Xem lại video hướng dẫn nhanh

---

## 6.13. Trang dinh dưỡng `/dinh-duong`

### Nội dung
#### Nữ giảm cân
- Ăn đủ protein
- Giảm đồ ngọt
- Hạn chế trà sữa
- Không nhịn ăn
- Uống 2–3 lít nước/ngày

#### Nam tăng cơ
- Protein 1.6–2g/kg cân nặng
- Ăn đủ carb sạch
- Ngủ 7–8 tiếng
- Tăng calo nhẹ nếu muốn tăng cân

---

## 7. Chức năng chính của website

## 7.1. Xem giáo án tập luyện
Người dùng chọn giáo án theo mục tiêu:
- Nữ giảm cân
- Nam mới tập

Mỗi giáo án có:
- 5 buổi/tuần
- Bài tập từng buổi
- Sets/reps
- Nghỉ giữa hiệp
- Cardio
- Mô tả bài tập

---

## 7.2. Xem thư viện bài tập
Người dùng có thể tìm bài tập theo:
- Tên bài
- Nhóm cơ
- Thiết bị
- Mức độ khó
- Mục tiêu

---

## 7.3. Xem video/hình ảnh hướng dẫn
Mỗi bài tập có thể có:
- Ảnh thumbnail
- GIF minh họa
- Video hướng dẫn
- Video YouTube embed

Nguồn dữ liệu có thể đến từ:
- API bài tập bên thứ ba
- YouTube Data API
- Dữ liệu tự upload từ admin

---

## 7.4. Checklist buổi tập
Trong mỗi buổi tập, người dùng có thể:
- Tick bài đã hoàn thành
- Ghi mức tạ
- Ghi số reps thực tế
- Ghi cảm nhận sau buổi tập

---

## 7.5. Timer nghỉ giữa hiệp
Chức năng:
- Timer 45 giây
- Timer 60 giây
- Timer 90 giây
- Tùy chỉnh thời gian nghỉ

Dùng cho:
- Nghỉ giữa hiệp
- Circuit training
- Cardio interval

---

## 7.6. Theo dõi tiến độ
Người dùng có thể lưu:
- Ngày tập
- Bài tập đã hoàn thành
- Mức tạ
- Số reps
- Cân nặng
- Số đo cơ thể

---

## 7.7. Gợi ý bài tập thay thế
Nếu phòng gym không có máy hoặc thiết bị, website gợi ý bài thay thế.

Ví dụ:
- Leg Press → Goblet Squat
- Assisted Pull Up → Lat Pulldown
- Cable Kickback → Glute Bridge
- Bench Press → Chest Press Machine

---

## 7.8. Admin quản lý nội dung
Admin có thể:
- Thêm bài tập
- Sửa bài tập
- Thêm video
- Thêm ảnh
- Tạo giáo án
- Sắp xếp bài trong từng buổi
- Quản lý nhóm cơ
- Quản lý thiết bị

---

## 7.9. To-do từng ngày trong 1 tháng

### Cách hoạt động
Khi người dùng chọn giáo án, hệ thống tạo lịch 1 tháng gồm:
- Ngày tập
- Ngày nghỉ
- Checklist tập luyện
- Checklist dinh dưỡng
- Checklist phục hồi
- Mục tiêu theo tuần

### Cấu trúc tháng mẫu
- Tuần 1: Làm quen kỹ thuật, tập nhẹ
- Tuần 2: Ổn định lịch tập, tăng độ đều đặn
- Tuần 3: Tăng nhẹ mức tạ hoặc reps
- Tuần 4: Tổng kết, giảm tải nhẹ nếu cần

### Ví dụ tuần
- Thứ 2: Tập buổi 1 + uống đủ nước + ghi cảm nhận
- Thứ 3: Tập buổi 2 + cardio nhẹ + ăn đủ protein
- Thứ 4: Nghỉ + đi bộ + giãn cơ
- Thứ 5: Tập buổi 3 + ghi mức tạ
- Thứ 6: Tập buổi 4 + ngủ đủ giấc
- Thứ 7: Tập buổi 5 + tổng kết tuần
- Chủ nhật: Nghỉ + chuẩn bị tuần mới

---

## 7.10. Tổng kết và đánh giá sau 1 tháng

### Logic đánh giá
- Nếu hoàn thành trên 85%: gợi ý tăng độ khó nhẹ
- Nếu hoàn thành 60–85%: tiếp tục giáo án hiện tại
- Nếu dưới 60%: giảm số buổi hoặc đơn giản hóa to-do
- Nếu bỏ lỡ cardio nhiều: nhắc ưu tiên cardio ngắn hơn
- Nếu không ghi cân nặng/số đo: nhắc cập nhật dữ liệu đều hơn

### Output cho người dùng
- Điểm hoàn thành tháng
- Nhận xét tiến bộ
- Điểm mạnh
- Điểm cần cải thiện
- Gợi ý giáo án tháng sau
- Gợi ý thói quen sức khỏe nên giữ

---

## 8. API hình ảnh/video đề xuất

## 8.1. ExerciseDB API
Phù hợp nếu cần database bài tập lớn, có ảnh/GIF/video và thông tin bài tập.

Dữ liệu mong muốn:
- Tên bài tập
- Nhóm cơ
- Thiết bị
- Hướng dẫn
- GIF/ảnh/video

Cách dùng:
- Gọi API theo tên bài tập
- Map tên tiếng Anh sang tiếng Việt trong database nội bộ
- Cache dữ liệu vào database để tránh phụ thuộc API ngoài

---

## 8.2. API Ninjas Exercises API
Phù hợp để lấy danh sách bài tập theo:
- Tên
- Nhóm cơ
- Loại bài
- Độ khó

Lưu ý:
- Có thể mạnh về dữ liệu text
- Có thể cần tự bổ sung ảnh/video riêng

---

## 8.3. YouTube Data API
Phù hợp để lấy video hướng dẫn.

Cách dùng:
- Search query theo tên bài tập, ví dụ:
  - “Goblet Squat tutorial proper form”
  - “Hip Thrust proper form beginner”
- Lưu videoId tốt nhất vào database
- Embed video bằng iframe

Lưu ý:
- Không nên search trực tiếp quá nhiều ở frontend
- Nên search qua backend/admin rồi lưu video đã duyệt
- Tránh hiển thị video sai kỹ thuật

---

## 8.4. Cloudinary/ImageKit
Phù hợp nếu muốn tự quản lý ảnh/video.

Ưu điểm:
- Chủ động nội dung
- Tối ưu ảnh tốt
- Không phụ thuộc dữ liệu bên thứ ba
- Dễ kiểm duyệt chất lượng

---

## 9. Data model đề xuất

## 9.1. Exercise

```ts
type Exercise = {
  id: string;
  nameVi: string;
  nameEn: string;
  slug: string;
  description: string;
  primaryMuscles: string[];
  secondaryMuscles: string[];
  equipment: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  goalTags: string[];
  instructions: string[];
  commonMistakes: string[];
  tips: string[];
  imageUrl?: string;
  gifUrl?: string;
  videoUrl?: string;
  youtubeVideoId?: string;
  alternatives?: string[];
};
```

---

## 9.2. WorkoutPlan

```ts
type WorkoutPlan = {
  id: string;
  title: string;
  slug: string;
  targetUser: 'female_weight_loss' | 'male_beginner';
  level: 'beginner' | 'intermediate' | 'advanced';
  daysPerWeek: number;
  goal: string;
  description: string;
  sessions: WorkoutSession[];
};
```

---

## 9.3. WorkoutSession

```ts
type WorkoutSession = {
  id: string;
  title: string;
  dayIndex: number;
  focus: string[];
  exercises: SessionExercise[];
  cardio?: CardioBlock;
};
```

---

## 9.4. SessionExercise

```ts
type SessionExercise = {
  exerciseId: string;
  sets: number;
  reps: string;
  restSeconds: number;
  note?: string;
};
```

---

## 9.5. ProgressLog

```ts
type ProgressLog = {
  id: string;
  userId: string;
  workoutPlanId: string;
  sessionId: string;
  date: string;
  status: 'completed' | 'skipped' | 'in_progress';
  exerciseLogs: ExerciseLog[];
};
```

---

## 9.6. ExerciseLog

```ts
type ExerciseLog = {
  exerciseId: string;
  sets: {
    weight?: number;
    reps?: number;
    completed: boolean;
  }[];
  note?: string;
};
```

---

## 9.7. DailyTodo

```ts
type DailyTodo = {
  id: string;
  userId: string;
  date: string;
  planDayIndex?: number;
  type: 'training' | 'rest' | 'recovery';
  title: string;
  tasks: DailyTodoTask[];
  waterLiters?: number;
  sleepHours?: number;
  steps?: number;
  bodyWeight?: number;
  mood?: 'bad' | 'normal' | 'good' | 'great';
  energyLevel?: 1 | 2 | 3 | 4 | 5;
  completionRate: number;
  note?: string;
};
```

---

## 9.8. DailyTodoTask

```ts
type DailyTodoTask = {
  id: string;
  title: string;
  category: 'workout' | 'nutrition' | 'recovery' | 'habit';
  completed: boolean;
  required: boolean;
};
```

---

## 9.9. MonthlyReview

```ts
type MonthlyReview = {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  completedTrainingDays: number;
  completedTodoDays: number;
  missedDays: number;
  averageCompletionRate: number;
  longestStreak: number;
  startWeight?: number;
  endWeight?: number;
  bodyMeasurementsChange?: {
    waist?: number;
    hip?: number;
    chest?: number;
  };
  strongestProgressExercises: {
    exerciseId: string;
    startWeight?: number;
    endWeight?: number;
    improvementNote: string;
  }[];
  summaryText: string;
  nextMonthSuggestion: string;
};
```

---

## 10. Database schema gợi ý với MongoDB/Mongoose

MongoDB phù hợp hơn PostgreSQL cho phiên bản này vì dữ liệu giáo án, buổi tập, checklist và log theo ngày có cấu trúc lồng nhau tự nhiên.

### 10.1. Kết nối MongoDB trong Next.js

```ts
// lib/mongodb.ts
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI!;

if (!MONGODB_URI) {
  throw new Error('Missing MONGODB_URI');
}

let cached = global.mongoose as {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectMongoDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI);
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
```

### 10.2. Exercise model

```ts
// models/Exercise.ts
import { Schema, model, models } from 'mongoose';

const ExerciseSchema = new Schema(
  {
    nameVi: { type: String, required: true },
    nameEn: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: String,
    primaryMuscles: [String],
    secondaryMuscles: [String],
    equipment: [String],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    goalTags: [String],
    instructions: [String],
    commonMistakes: [String],
    tips: [String],
    imageUrl: String,
    gifUrl: String,
    videoUrl: String,
    youtubeVideoId: String,
    alternatives: [{ type: Schema.Types.ObjectId, ref: 'Exercise' }]
  },
  { timestamps: true }
);

export default models.Exercise || model('Exercise', ExerciseSchema);
```

### 10.3. WorkoutPlan model

```ts
// models/WorkoutPlan.ts
import { Schema, model, models } from 'mongoose';

const SessionExerciseSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: Number,
    reps: String,
    restSeconds: Number,
    note: String
  },
  { _id: false }
);

const WorkoutSessionSchema = new Schema(
  {
    title: String,
    dayIndex: Number,
    focus: [String],
    exercises: [SessionExerciseSchema],
    cardio: {
      title: String,
      durationMinutes: Number,
      intensity: String,
      note: String
    }
  },
  { _id: true }
);

const WorkoutPlanSchema = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    targetUser: {
      type: String,
      enum: ['female_weight_loss', 'male_beginner'],
      required: true
    },
    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      default: 'beginner'
    },
    daysPerWeek: Number,
    goal: String,
    description: String,
    sessions: [WorkoutSessionSchema]
  },
  { timestamps: true }
);

export default models.WorkoutPlan || model('WorkoutPlan', WorkoutPlanSchema);
```

### 10.4. DailyTodo model

```ts
// models/DailyTodo.ts
import { Schema, model, models } from 'mongoose';

const DailyTodoTaskSchema = new Schema(
  {
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ['workout', 'nutrition', 'recovery', 'habit'],
      required: true
    },
    completed: { type: Boolean, default: false },
    required: { type: Boolean, default: true }
  },
  { _id: true }
);

const DailyTodoSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    planId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    sessionId: String,
    type: {
      type: String,
      enum: ['training', 'rest', 'recovery'],
      default: 'training'
    },
    title: String,
    tasks: [DailyTodoTaskSchema],
    waterLiters: Number,
    sleepHours: Number,
    steps: Number,
    bodyWeight: Number,
    mood: {
      type: String,
      enum: ['bad', 'normal', 'good', 'great']
    },
    energyLevel: {
      type: Number,
      min: 1,
      max: 5
    },
    completionRate: {
      type: Number,
      default: 0
    },
    note: String
  },
  { timestamps: true }
);

DailyTodoSchema.index({ userId: 1, date: 1 }, { unique: true });

export default models.DailyTodo || model('DailyTodo', DailyTodoSchema);
```

### 10.5. ProgressLog model

```ts
// models/ProgressLog.ts
import { Schema, model, models } from 'mongoose';

const ExerciseLogSchema = new Schema(
  {
    exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise', required: true },
    sets: [
      {
        weight: Number,
        reps: Number,
        completed: { type: Boolean, default: false }
      }
    ],
    note: String
  },
  { _id: false }
);

const ProgressLogSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    workoutPlanId: { type: Schema.Types.ObjectId, ref: 'WorkoutPlan' },
    sessionId: String,
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ['completed', 'skipped', 'in_progress'],
      default: 'in_progress'
    },
    exerciseLogs: [ExerciseLogSchema],
    notes: String
  },
  { timestamps: true }
);

ProgressLogSchema.index({ userId: 1, date: 1 });

export default models.ProgressLog || model('ProgressLog', ProgressLogSchema);
```

### 10.6. MonthlyReview model

```ts
// models/MonthlyReview.ts
import { Schema, model, models } from 'mongoose';

const MonthlyReviewSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    month: { type: String, required: true }, // YYYY-MM
    completedTrainingDays: Number,
    completedTodoDays: Number,
    missedDays: Number,
    averageCompletionRate: Number,
    longestStreak: Number,
    startWeight: Number,
    endWeight: Number,
    bodyMeasurementsChange: {
      waist: Number,
      hip: Number,
      chest: Number
    },
    strongestProgressExercises: [
      {
        exerciseId: { type: Schema.Types.ObjectId, ref: 'Exercise' },
        startWeight: Number,
        endWeight: Number,
        improvementNote: String
      }
    ],
    summaryText: String,
    nextMonthSuggestion: String
  },
  { timestamps: true }
);

MonthlyReviewSchema.index({ userId: 1, month: 1 }, { unique: true });

export default models.MonthlyReview || model('MonthlyReview', MonthlyReviewSchema);
```

---

## 10A. Kiến trúc Next.js server/client

### Nguyên tắc
- Trang đọc dữ liệu chính dùng Server Component để nhanh và tốt cho SEO.
- Thành phần có tương tác dùng Client Component.
- Dữ liệu quan trọng luôn lưu MongoDB, không chỉ lưu localStorage.
- API/Server Actions chỉ chạy ở server để bảo vệ database và API key.

### Ví dụ phân chia

| Khu vực | Loại component | Lý do |
|---|---|---|
| Trang chủ | Server Component | SEO, load nhanh |
| Danh sách bài tập | Server Component + filter client | Dữ liệu từ MongoDB, filter nhanh |
| Chi tiết bài tập | Server Component | SEO tốt |
| Timer nghỉ | Client Component | Cần state realtime |
| Checklist bài tập | Client Component + Server Action | Tick nhanh, lưu MongoDB |
| To-do ngày | Client Component + Server Action | Tương tác liên tục |
| Tổng kết tháng | Server Component | Tính toán từ MongoDB |
| Admin CRUD | Client form + Route Handler | Cần upload, validate, mutate data |

### Server Actions đề xuất

```ts
'use server';

import { connectMongoDB } from '@/lib/mongodb';
import DailyTodo from '@/models/DailyTodo';

export async function toggleTodoTask(todoId: string, taskId: string) {
  await connectMongoDB();

  const todo = await DailyTodo.findById(todoId);
  if (!todo) throw new Error('Todo not found');

  const task = todo.tasks.id(taskId);
  task.completed = !task.completed;

  const completed = todo.tasks.filter((item: any) => item.completed).length;
  todo.completionRate = Math.round((completed / todo.tasks.length) * 100);

  await todo.save();

  return {
    success: true,
    completionRate: todo.completionRate
  };
}
```

### Route Handler ví dụ

```ts
// app/api/todos/route.ts
import { NextResponse } from 'next/server';
import { connectMongoDB } from '@/lib/mongodb';
import DailyTodo from '@/models/DailyTodo';

export async function GET(request: Request) {
  await connectMongoDB();

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');

  const todos = await DailyTodo.find({
    date: {
      $gte: new Date(`${month}-01`),
      $lt: new Date(`${month}-31`)
    }
  }).sort({ date: 1 });

  return NextResponse.json(todos);
}
```


---

## 11. UX/UI Style Guide

## 11.1. Phong cách thiết kế
- Hiện đại
- Sạch sẽ
- Năng động
- Dễ đọc khi dùng trên điện thoại
- Ưu tiên thao tác nhanh tại phòng gym

## 11.2. Màu sắc đề xuất

### Primary
- Đen than: `#111827`
- Xanh fitness: `#22C55E`

### Secondary
- Xám nền: `#F3F4F6`
- Trắng: `#FFFFFF`
- Cam nhấn: `#F97316`

### Semantic
- Hoàn thành: xanh lá
- Đang tập: cam
- Bỏ lỡ: đỏ
- Nghỉ: xám

---

## 11.3. Typography
- Font: Inter hoặc Be Vietnam Pro
- Heading: Bold, rõ ràng
- Body: Dễ đọc, line-height thoáng

---

## 11.4. Component chính

### WorkoutPlanCard
Hiển thị giáo án.

### WorkoutSessionTabs
Tabs 5 buổi tập.

### ExerciseCard
Card bài tập.

### ExerciseDetail
Thông tin chi tiết bài tập.

### VideoGuide
Hiển thị YouTube embed hoặc video nội bộ.

### RestTimer
Timer nghỉ giữa hiệp.

### ProgressChecklist
Checklist bài tập trong buổi.

### MuscleBadge
Badge nhóm cơ.

### EquipmentBadge
Badge thiết bị.

---

## 12. User flow chính

## 12.1. Người dùng nữ giảm cân
1. Vào trang chủ
2. Chọn “Nữ mới tập cần giảm cân”
3. Xem lịch 5 buổi
4. Chọn buổi hôm nay
5. Xem từng bài tập
6. Bấm xem video hướng dẫn
7. Tick hoàn thành từng bài
8. Ghi cân nặng hoặc cảm nhận

---

## 12.2. Người dùng nam mới tập
1. Vào trang chủ
2. Chọn “Nam mới tập”
3. Xem lịch Push/Pull/Legs/Upper/Full Body
4. Bắt đầu buổi tập
5. Ghi mức tạ từng bài
6. Theo dõi tiến bộ theo tuần

---

## 13. Tính năng MVP

Phiên bản đầu tiên nên có:

1. Trang chủ
2. Trang giáo án nữ giảm cân
3. Trang giáo án nam mới tập
4. Trang thư viện bài tập
5. Trang chi tiết bài tập
6. Hình ảnh/video hướng dẫn thủ công hoặc từ API
7. Bộ lọc bài tập
8. Checklist hoàn thành bài tập lưu MongoDB
9. Timer nghỉ giữa hiệp
10. To-do từng ngày trong 1 tháng
11. Tổng kết tháng cơ bản
12. Responsive mobile-first

---

## 14. Tính năng nâng cao sau MVP

1. Đăng nhập tài khoản
2. Lưu lịch sử tập luyện
3. Theo dõi cân nặng/số đo
4. Biểu đồ tiến bộ
5. AI gợi ý giáo án
6. Admin CMS
7. Tạo giáo án cá nhân
8. Tự động gợi ý bài thay thế
9. Tích hợp smartwatch
10. Tích hợp dinh dưỡng/calorie tracker

---

## 15. Chiến lược dữ liệu bài tập

## Giai đoạn 1 — MVP
- Tự tạo dữ liệu bài tập bằng tiếng Việt
- Dùng ảnh/video được admin kiểm duyệt
- Lưu file seed trong database

## Giai đoạn 2 — API hỗ trợ
- Dùng API bên thứ ba để lấy ảnh/GIF/video
- Map tên tiếng Anh với bài tiếng Việt
- Cache dữ liệu vào database
- Admin kiểm duyệt trước khi publish

## Giai đoạn 3 — Nội dung riêng
- Tự quay video hướng dẫn chuẩn PT
- Upload lên Cloudinary hoặc YouTube riêng
- Tối ưu SEO từng bài tập

---

## 16. SEO

### Trang nên tối ưu SEO
- `/bai-tap/goblet-squat`
- `/bai-tap/hip-thrust`
- `/bai-tap/lat-pulldown`
- `/giao-an/nu-giam-can`
- `/giao-an/nam-moi-tap`

### Meta title mẫu
“Goblet Squat là gì? Cách tập đúng cho người mới”

### Meta description mẫu
“Hướng dẫn Goblet Squat bằng tiếng Việt: nhóm cơ tác động, cách tập đúng, lỗi thường gặp và video minh họa cho người mới tập gym.”

---

## 17. API routes đề xuất trong Next.js

```txt
GET /api/exercises
GET /api/exercises/:slug
GET /api/workout-plans
GET /api/workout-plans/:slug
GET /api/today
GET /api/todos?month=2026-05
POST /api/todos
PATCH /api/todos/:id
POST /api/progress
GET /api/progress/me
GET /api/monthly-review?month=2026-05
POST /api/monthly-review/generate
GET /api/youtube/search?exercise=hip-thrust
POST /api/admin/exercises
PATCH /api/admin/exercises/:id
DELETE /api/admin/exercises/:id
```

---

## 18. Cách tích hợp YouTube video an toàn

Không nên để frontend tự search YouTube mỗi lần người dùng mở bài tập.

Luồng đề xuất:
1. Admin nhập tên bài tập
2. Backend gọi YouTube Data API để search video
3. Admin chọn video đúng kỹ thuật
4. Lưu `youtubeVideoId` vào database
5. Frontend chỉ embed video đã được duyệt

Ưu điểm:
- Tránh video sai kỹ thuật
- Tiết kiệm quota API
- Tăng chất lượng nội dung

---

## 19. Ví dụ dữ liệu seed bài tập

```ts
export const exercises = [
  {
    nameVi: 'Goblet Squat',
    nameEn: 'Goblet Squat',
    slug: 'goblet-squat',
    primaryMuscles: ['Đùi trước', 'Mông'],
    secondaryMuscles: ['Core'],
    equipment: ['Dumbbell'],
    difficulty: 'beginner',
    goalTags: ['giảm cân', 'săn chắc', 'chân mông'],
    instructions: [
      'Cầm một quả dumbbell trước ngực',
      'Đứng hai chân rộng bằng vai',
      'Hạ người xuống như ngồi ghế',
      'Đẩy gót chân đứng lên'
    ],
    tips: [
      'Giữ lưng thẳng',
      'Gối hướng theo mũi chân',
      'Không chồm người quá nhiều'
    ]
  }
];
```

---

## 20. Ưu tiên phát triển

### Sprint 1
- Setup Next.js
- Setup Tailwind/shadcn
- Tạo layout chính
- Tạo trang chủ
- Tạo dữ liệu seed bài tập

### Sprint 2
- Trang giáo án nữ
- Trang giáo án nam
- Trang chi tiết bài tập
- Component ExerciseCard

### Sprint 3
- Bộ lọc bài tập
- Timer nghỉ
- Checklist localStorage
- Responsive mobile

### Sprint 4
- Setup MongoDB Atlas
- Tạo Mongoose models
- Lưu checklist/to-do/progress vào MongoDB
- Admin CRUD bài tập
- Tích hợp video/image API

### Sprint 5
- Trang hôm nay
- To-do từng ngày trong tháng
- Tổng kết tháng
- Biểu đồ completion rate, cân nặng, số buổi tập

### Sprint 6
- Cá nhân hóa gợi ý tháng tiếp theo
- Tự động tạo to-do theo giáo án
- Reminder nhẹ qua email/push nếu có tài khoản

---

## 21. Kết luận

Website nên bắt đầu bằng MVP đơn giản nhưng chắc:
- Nội dung tiếng Việt rõ ràng
- Lịch tập 5 buổi dễ theo
- Có hình/video minh họa
- Mobile-first
- Có checklist và timer

Sau đó mới mở rộng sang tài khoản, tracking, admin CMS và AI cá nhân hóa giáo án.

