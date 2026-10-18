# WearShare – Frontend (mobile app)

## Chạy thử (không cần backend)
1. Giải nén thư mục.
2. Mở `index.html` (double-click, hoặc VS Code → chuột phải → **Open with Live Server**).
3. Bấm đăng nhập bất kỳ → vào app ở **demo mode** (dữ liệu mẫu, lưu tạm trong trình duyệt).
4. Ô **"Demo · viewing as"** ở trên cùng để đổi sang user khác (vd: Maya) → thử gửi/duyệt request.

Trên máy tính app hiện trong khung điện thoại; trên điện thoại thật thì full màn hình.

## Ghép với backend sau này
Chép 6 file này đè vào `closetshare-full/frontend/`, rồi trong `config.js` sửa:
```js
window.CLOSETSHARE_API = 'http://localhost:8000';
```
Chạy backend (`uvicorn app.main:app --reload`) rồi mở lại bằng Live Server.

Files: index.html · styles.css · app.js (logic) · wearshare.js (giao diện) · live.js (kết nối backend) · config.js
