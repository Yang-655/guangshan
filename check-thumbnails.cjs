const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

console.log('🔍 检查数据库中的缩略图数据...');

db.all(`
  SELECT 
    id, 
    title, 
    user_id,
    thumbnail_url IS NOT NULL as has_thumbnail,
    CASE 
      WHEN thumbnail_url IS NULL THEN 'NULL'
      WHEN thumbnail_url LIKE 'data:%' THEN 'Base64'
      WHEN thumbnail_url LIKE 'http%' THEN 'HTTP'
      ELSE 'Other'
    END as thumbnail_type,
    LENGTH(thumbnail_url) as thumbnail_size,
    created_at
  FROM videos 
  ORDER BY created_at DESC 
  LIMIT 10
`, (err, rows) => {
  if (err) {
    console.error('❌ 查询失败:', err);
    return;
  }
  
  console.log('\n📊 最新10个视频的缩略图状态:');
  console.log('=' .repeat(80));
  
  if (rows.length === 0) {
    console.log('📭 数据库中没有视频记录');
  } else {
    rows.forEach((row, index) => {
      console.log(`\n${index + 1}. 视频ID: ${row.id}`);
      console.log(`   标题: ${row.title || '未命名'}`);
      console.log(`   用户: ${row.user_id}`);
      console.log(`   有缩略图: ${row.has_thumbnail ? '✅ 是' : '❌ 否'}`);
      console.log(`   缩略图类型: ${row.thumbnail_type}`);
      console.log(`   数据大小: ${row.thumbnail_size ? Math.round(row.thumbnail_size / 1024) + ' KB' : 'N/A'}`);
      console.log(`   创建时间: ${row.created_at}`);
    });
    
    const withThumbnail = rows.filter(r => r.has_thumbnail).length;
    const withBase64 = rows.filter(r => r.thumbnail_type === 'Base64').length;
    
    console.log('\n📈 统计信息:');
    console.log(`   总视频数: ${rows.length}`);
    console.log(`   有缩略图: ${withThumbnail} (${Math.round(withThumbnail/rows.length*100)}%)`);
    console.log(`   Base64缩略图: ${withBase64}`);
  }
  
  db.close();
});