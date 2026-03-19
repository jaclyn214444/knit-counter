# KnitVibe — Vite 打包與 App 雙軌開發完成

## 達成方案：Capacitor
我們成功導入了 **Capacitor**。這個工具可以將我們剛才建立的 Vite 網頁直接包裝成原生的 App。

這代表：**您的網頁與 App 共享 100% 相同的 React 程式碼**！一次修改，兩邊同步更新。

---

## 專案結構變更

```
d:\src\
├── android/             ← 🤖 (新增) Android 原生專案資料夾
├── capacitor.config.json← ⚙️ (新增) Capacitor 設定檔
├── dist/                ← 網頁打包產出 (App 也是讀這裡)
├── src/                 ← 您的 React 原始碼
└── ...
```

---

## 🚀 雙軌開發：常用指令對照表

| 目標 | 指令 / 操作方式 | 說明 |
|------|-----------------|------|
| **[全端] 開發與修改** | `npm run dev` | 不論是做網頁還是 App，開發時都使用網頁伺服器即時看效果 |
| **[網頁] 打包部署** | `npm run build` | 產生出 `dist/` 資料夾，即可上傳至任何靜態網頁主機 |
| **[手機] 同步進度** | `npm run build` <br>接著執行 <br>`npx cap sync` | 當您改完網頁，想把最新進度更新到手機 App 中時，請執行此兩步驟 |
| **[手機] 安裝到裝置** | `npx cap open android` | 執行後會自動打開 **Android Studio**，您可以直接點擊 `Run` 按鈕安裝到接上的手機，或產生 APK 檔 |

> **提示**：目前環境由於是在 Windows 系統下，只能封裝並編譯 Android App。如果未來需要發布 iOS 版本，請在 Mac 電腦上將這整包原始碼下載後，執行 `npm install` 並使用 `npx cap add ios` 即可無縫接軌！
