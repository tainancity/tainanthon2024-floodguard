# tainanthon2024-floodguard
# 2024台南黑客松-淹水避難點警示及引導

## 簡介
這是一個基於 Django 開發的網頁應用，用於顯示避難所資訊、淹水回報功能以及路徑推薦功能。用戶可以通過地圖互動查看避難所、規劃路徑，並匯報當地的淹水情況。

---

## 系統需求
- Python 版本：**3.10 或以上**
- 其他需求：詳見 `requirements.txt`

---

## 功能列表
1. **避難所地圖顯示**
   - 顯示各地避難所的位置，支持不同災害類型的篩選。
2. **路徑規劃**
   - 用戶可以選擇起點和終點，並規劃避開禁行區域的路徑。
3. **禁行區域設定**
   - 用戶可以手動在地圖上畫出多邊形禁行區域，並納入路徑規劃計算。
4. **淹水回報功能**
   - 用戶可填寫淹水時間、地點及水深，並提交至系統保存。
5. **中央氣象局測站數據顯示**
   - 顯示台南市測站數據，包括過去 6、12、24 小時降雨量。

---

## 安裝與運行

### 1. 下載專案

```bash
git clone https://github.com/<your_username>/<your_repo_name>.git
cd <your_repo_name>
```

### 2. 配置 API 金鑰

1. 前往 [交通部中央氣象署](https://opendata.cwb.gov.tw/) 申請 CWB API 金鑰。
2. 前往 [OpenRouteService](https://openrouteservice.org/sign-up/) 申請 ORS API 金鑰。
3. 運行以下指令來生成一個隨機的 SECRET_KEY：

```bash
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

4. 將金鑰填入 `.env` 文件中，格式如下：

```env
CWB_API_KEY=您的中央氣象署金鑰
ORS_API_KEY=您的OpenRouteService金鑰
SECRET_KEY = 您的django金鑰
```

### 3. 安裝依賴

在專案目錄中運行以下指令來安裝所需的依賴項：

```bash
pip install -r requirements.txt
```

### 4. 運行專案

使用以下命令啟動開發伺服器：

```bash
python manage.py runserver
```

伺服器啟動後，打開瀏覽器並訪問：`http://127.0.0.1:8000/map`

---

## 資料夾結構

```
<專案名稱>/
├── .env                      # API 金鑰配置
├── db.sqlite3                # SQLite 資料庫
├── manage.py                 # Django 管理命令入口
├── requirements.txt          # 依賴列表
├── shelter_project/          # Django 項目目錄
│   ├── asgi.py               # ASGI 配置文件
│   ├── settings.py           # 配置文件
│   ├── urls.py               # 路由設置
│   ├── wsgi.py               # WSGI 配置文件
│   └── __init__.py           # Python 包初始化文件
├── shelters/                 # 應用目錄
│   ├── admin.py              # Django 管理界面配置
│   ├── apps.py               # 應用配置
│   ├── models.py             # 數據庫模型
│   ├── tests.py              # 測試文件
│   ├── views.py              # 應用視圖
│   ├── __init__.py           # Python 包初始化文件
│   └── migrations/           # 數據庫遷移文件
│       ├── 0001_initial.py   # 初始遷移文件
│       ├── 0002_xxx.py       # 更新遷移文件
│       └── __init__.py       # Python 包初始化文件
├── static/                   # 靜態資源
│   ├── css/
│   │   └── style.css         # 樣式文件
│   ├── data/                 # 靜態數據文件
│   │   ├── flood_reports.json # 淹水回報數據
│   │   ├── shelterdata.json  # 避難所數據
│   │   └── area/             # 地理數據文件
│   │       ├── 6h150.shp     # 示例地理數據文件
│   │       └── ...           # 其他地理數據
│   ├── images/
│   │   ├── drop.png          # 測站圖標
│   │   ├── red_pin.png       # 目前位置圖標
│   │   ├── yellow_pin.png    # 避難所圖標
│   │   └── ...               # 其他圖標
│   └── js/
│       ├── script.js         # 主腳本
│       └── weather.js        # 天氣功能腳本
├── templates/                # HTML 模板
│   ├── base.html             # 基本模板
│   ├── map.html              # 地圖頁面模板
└── README.md                 # 專案說明文件

```

---

## 注意事項

1. **Django 開發伺服器僅適用於開發環境，不建議用於生產環境。**
2. 確保 `.env` 文件不被上傳到公開的版本控制系統。
3. 本專案中的部分功能依賴外部 API，請確保您擁有穩定的網路環境。

---

## 常見問題

### Q: 啟動伺服器時出現錯誤 `ModuleNotFoundError`？
A: 請確保已經正確安裝 `requirements.txt` 中的所有依賴。

### Q: 地圖頁面無法顯示？
A: 請檢查您的 `.env` 文件中是否正確填入 API 金鑰。

### Q: 避難所數據或測站數據未正確顯示？
A: 確保 `data` 資料夾中的數據文件存在，並且格式正確。

---

## 貢獻
歡迎提交 Pull Request 或 Issues 來改進本專案！

---

## 授權
本專案採用 [MIT License](https://opensource.org/licenses/MIT) 授權。
