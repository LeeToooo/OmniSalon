// =========================================================================
// OmniSalon — AUTOMATIC DATABASE INITIALIZATION & VERIFICATION
// Tự động kiểm tra & nạp CSDL QL_SALON.sql vào SQL Server / SQL Express
// =========================================================================

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const sql = require('msnodesqlv8');

const ROOT_DIR = path.resolve(__dirname, '..', '..');
const SQL_FILE = fs.existsSync(path.join(__dirname, 'QL_SALON.sql')) 
  ? path.join(__dirname, 'QL_SALON.sql') 
  : (fs.existsSync(path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql')) ? path.join(ROOT_DIR, 'web', 'backend', 'QL_SALON.sql') : path.join(ROOT_DIR, 'QL_SALON.sql'));
const DB_NAME = process.env.SQL_DATABASE || 'QL_SALONTOC';
const SERVER_INSTANCES = [
  process.env.SQL_SERVER,
  '.\\SQLEXPRESS',
  'localhost\\SQLEXPRESS',
  '(local)\\SQLEXPRESS',
  'localhost',
  '.'
].filter(Boolean);

const DRIVERS = [
  'ODBC Driver 18 for SQL Server',
  'ODBC Driver 17 for SQL Server',
  'SQL Server'
];

function findSqlCmd() {
  // 1. Check in PATH
  try {
    const res = execSync('where sqlcmd', { stdio: ['ignore', 'pipe', 'ignore'], encoding: 'utf8' }).trim();
    const firstLine = res.split(/\r?\n/)[0].trim();
    if (firstLine && fs.existsSync(firstLine)) return firstLine;
  } catch (e) {}

  // 2. Check well-known install locations
  const candidates = [
    'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files\\Microsoft SQL Server\\160\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files\\Microsoft SQL Server\\150\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files\\Microsoft SQL Server\\140\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files (x86)\\Microsoft SQL Server\\Client SDK\\ODBC\\180\\Tools\\Binn\\SQLCMD.EXE',
    'C:\\Program Files (x86)\\Microsoft SQL Server\\Client SDK\\ODBC\\170\\Tools\\Binn\\SQLCMD.EXE'
  ];

  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return null;
}

function queryPromise(connStr, query) {
  return new Promise((resolve, reject) => {
    sql.query(connStr, query, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

async function testConnection(server, driver, db = 'master') {
  const connStr = `Server=${server};Database=${db};Trusted_Connection=yes;Driver={${driver}};TrustServerCertificate=yes;`;
  try {
    const rows = await queryPromise(connStr, 'SELECT 1 AS ok;');
    if (rows && rows.length > 0) return { success: true, connStr };
  } catch (err) {
    return { success: false, error: err.message };
  }
  return { success: false, error: 'No rows returned' };
}

async function detectWorkingConnection(targetDb = 'master') {
  for (const srv of SERVER_INSTANCES) {
    for (const drv of DRIVERS) {
      const res = await testConnection(srv, drv, targetDb);
      if (res.success) {
        return { server: srv, driver: drv, connStr: res.connStr };
      }
    }
  }
  return null;
}

async function executeSqlFileViaBatches(connStr, filePath) {
  console.log(`[INIT_DB] Đang nạp tệp CSDL: ${path.basename(filePath)} qua SQL batches...`);
  const content = fs.readFileSync(filePath, 'utf8');
  // Split on GO statements at start of line
  const batches = content
    .split(/^\s*GO\s*$/gim)
    .map(b => b.trim())
    .filter(b => b.length > 0);

  console.log(`[INIT_DB] Tổng số ${batches.length} T-SQL batch(es). Đang thực thi...`);
  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      await queryPromise(connStr, batch);
      if ((i + 1) % 10 === 0 || i === batches.length - 1) {
        console.log(`[INIT_DB] Đã hoàn thành batch ${i + 1}/${batches.length}`);
      }
    } catch (err) {
      // Ignore non-fatal warnings
      console.warn(`[INIT_DB] Lưu ý ở batch ${i + 1}: ${err.message}`);
    }
  }
  console.log(`[INIT_DB] Hoàn tất nạp CSDL thành công!`);
}

async function main() {
  console.log('=========================================================================');
  console.log('   OMNISALON — KIỂM TRA & TỰ ĐỘNG KHỞI TẠO CSDL SQL SERVER');
  console.log('=========================================================================');

  if (!fs.existsSync(SQL_FILE)) {
    console.error(`[ERROR] Không tìm thấy tệp script CSDL: ${SQL_FILE}`);
    process.exit(1);
  }

  console.log('[1/4] Đang tìm kiếm SQL Server Instance và ODBC Driver...');
  const masterConn = await detectWorkingConnection('master');

  if (!masterConn) {
    console.error('\n[LỖI] Không thể kết nối tới SQL Server / SQL Express!');
    console.error('Nguyên nhân có thể:');
    console.error('1. Dịch vụ SQL Server (SQLEXPRESS) chưa được bật.');
    console.error('   -> Khắc phục: Mở PowerShell chạy: net start MSSQL$SQLEXPRESS');
    console.error('2. Máy tính chưa cài đặt SQL Server Express.');
    console.error('   -> Tải tại: https://www.microsoft.com/en-us/sql-server/sql-server-downloads');
    process.exit(1);
  }

  console.log(`[OK] Kết nối thành công tới SQL Server: ${masterConn.server} (Driver: ${masterConn.driver})`);

  console.log(`[2/4] Đang kiểm tra cơ sở dữ liệu [${DB_NAME}]...`);
  const checkDbQuery = `SELECT DB_ID('${DB_NAME}') AS db_id;`;
  const dbRows = await queryPromise(masterConn.connStr, checkDbQuery);
  const dbExists = dbRows && dbRows[0] && dbRows[0].db_id !== null;

  const forceReset = process.argv.includes('--force') || process.argv.includes('--reset');

  if (dbExists && !forceReset) {
    // Check if tables already exist
    const testDbConn = await detectWorkingConnection(DB_NAME);
    if (testDbConn) {
      const tblRows = await queryPromise(testDbConn.connStr, "SELECT COUNT(*) AS total FROM sys.tables WHERE is_ms_shipped = 0;");
      const tableCount = tblRows && tblRows[0] ? tblRows[0].total : 0;
      if (tableCount >= 10) {
        console.log(`[OK] Cơ sở dữ liệu [${DB_NAME}] đã sẵn sàng với ${tableCount} bảng! Bỏ qua khởi tạo lại.`);
        console.log('=========================================================================\n');
        process.exit(0);
      }
    }
  }

  console.log(`[3/4] CSDL [${DB_NAME}] chưa khởi tạo hoặc được yêu cầu nạp lại. Bắt đầu import từ QL_SALON.sql...`);

  const sqlcmdPath = findSqlCmd();
  if (sqlcmdPath) {
    console.log(`[INIT_DB] Tìm thấy SQLCMD tại: ${sqlcmdPath}`);
    console.log(`[INIT_DB] Đang thực thi QL_SALON.sql vào [${masterConn.server}]...`);
    const args = ['-S', masterConn.server, '-E', '-C', '-i', SQL_FILE];
    const proc = spawnSync(sqlcmdPath, args, { encoding: 'utf8', stdio: 'inherit' });
    if (proc.status === 0) {
      console.log(`[OK] SQLCMD đã nạp thành công toàn bộ cơ sở dữ liệu [${DB_NAME}]!`);
    } else {
      console.warn(`[WARN] SQLCMD thoát với mã ${proc.status}, chuyển sang nạp batch qua Node.js...`);
      await executeSqlFileViaBatches(masterConn.connStr, SQL_FILE);
    }
  } else {
    console.log(`[INIT_DB] Không tìm thấy SQLCMD. Sử dụng Node.js T-SQL batch runner...`);
    await executeSqlFileViaBatches(masterConn.connStr, SQL_FILE);
  }

  console.log(`[4/4] Kiểm tra lại tính toàn vẹn CSDL [${DB_NAME}]...`);
  const finalConn = await detectWorkingConnection(DB_NAME);
  if (finalConn) {
    const tblRows = await queryPromise(finalConn.connStr, "SELECT COUNT(*) AS total FROM sys.tables WHERE is_ms_shipped = 0;");
    const count = tblRows && tblRows[0] ? tblRows[0].total : 0;
    console.log(`[HOÀN TẤT] CSDL [${DB_NAME}] đã được khởi tạo hoàn chỉnh với ${count} bảng dữ liệu!`);
  } else {
    console.error(`[LƯU Ý] Chưa thể kết nối trực tiếp vào [${DB_NAME}]. Vui lòng mở SSMS để kiểm tra.`);
  }

  console.log('=========================================================================\n');
}

main().catch(err => {
  console.error('[FATAL ERROR] Lỗi khởi tạo cơ sở dữ liệu:', err);
  process.exit(1);
});
