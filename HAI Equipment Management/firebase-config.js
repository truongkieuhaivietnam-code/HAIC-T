// =====================================================================
// FIREBASE CONFIG - HAI-CLOUD PROJECT (config thật)
// =====================================================================

const firebaseConfig = {
  apiKey: "AIzaSyDrU-X28Z7cE1ebdR4VTYYMnzJpHYbMIRM",
  authDomain: "hai-cloud-88321.firebaseapp.com",
  projectId: "hai-cloud-88321",
  storageBucket: "hai-cloud-88321.firebasestorage.app",
  messagingSenderId: "246892343866",
  appId: "1:246892343866:web:ba497a1c2f5686e2de7b03",
  measurementId: "G-CJDC3350MC"
};

// Khởi tạo Firebase (dùng SDK v9 compat để giữ code dạng vanilla JS đơn giản,
// đồng bộ với các app HAIC-T khác)
firebase.initializeApp(firebaseConfig);

const auth = firebase.auth();
const db = firebase.firestore();
const storage = firebase.storage();

// Ghi chú: measurementId/Analytics không được dùng trong app này (app nội bộ
// nhân viên, không cần theo dõi truy cập web). Nếu anh muốn bật Analytics
// sau này, cần thêm script firebase-analytics-compat.js vào index.html và
// gọi firebase.analytics().

// =====================================================================
// NAMESPACE RIÊNG CHO APP NÀY TRONG PROJECT CHUNG
// Tất cả collection của app Equipment Management đều nằm dưới:
// apps/equipment/{collectionName}
// Để tách biệt hoàn toàn với data của các app khác dùng chung HAI-CLOUD.
// =====================================================================
// Lưu ý: "apps/equipment" là path của 1 DOCUMENT (collection "apps" ->
// document "equipment"). Mọi collection thực tế của app này là
// sub-collection bên dưới document đó, đảm bảo tách biệt hoàn toàn với
// các app khác đang dùng chung project HAI-CLOUD.

function getCollection(name) {
  return db.collection("apps").doc("equipment").collection(name);
}

// Export các collection chuẩn dùng xuyên suốt app.js
const COLLECTIONS = {
  users: getCollection("users"),
  fixedAssets: getCollection("fixed_assets"),
  equipment: getCollection("equipment"),
  calibrationStandards: getCollection("calibration_standards"),
  calibrationRecords: getCollection("calibration_records"),
  inventory: getCollection("inventory"),
  inventoryTransactions: getCollection("inventory_transactions"),
  movements: getCollection("movements"),
  maintenance: getCollection("maintenance"),
  purchaseRequests: getCollection("purchase_requests"),
  reports: getCollection("reports"),
  counters: getCollection("counters")
};
