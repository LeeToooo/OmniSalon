const { execSync } = require('child_process');

try {
  const json = execSync('flutter devices --machine', { encoding: 'utf8' });
  const devs = JSON.parse(json);
  const androidDevs = devs.filter(d => d.targetPlatform && d.targetPlatform.startsWith('android'));
  // Ưu tiên thiết bị thật nếu có, nếu không thì dùng máy ảo
  const selected = androidDevs.find(d => !d.emulator) || androidDevs[0];
  if (selected && selected.id) {
    process.stdout.write(selected.id);
  }
} catch (_) {}
