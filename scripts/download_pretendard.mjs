import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

// 프리텐다드 핵심 가중치 및 가변 폰트
const fontItems = [
  {
    name: 'PretendardVariable.woff2',
    url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/variable/woff2/PretendardVariable.woff2',
  },
  {
    name: 'Pretendard-Regular.woff2',
    url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Regular.woff2',
  },
  {
    name: 'Pretendard-Medium.woff2',
    url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Medium.woff2',
  },
  {
    name: 'Pretendard-SemiBold.woff2',
    url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-SemiBold.woff2',
  },
  {
    name: 'Pretendard-Bold.woff2',
    url: 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/packages/pretendard/dist/web/static/woff2/Pretendard-Bold.woff2',
  },
];

function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        let redirectUrl = res.headers.location;
        if (redirectUrl.startsWith('/')) {
          redirectUrl = 'https://cdn.jsdelivr.net' + redirectUrl;
        }
        downloadFile(redirectUrl, destPath).then(resolve).catch(reject);
        return;
      }

      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode} for ${url}`));
        return;
      }

      const file = fs.createWriteStream(destPath);
      res.pipe(file);
      file.on('finish', () => {
        file.close(() => {
          const stat = fs.statSync(destPath);
          console.log(`[Success] ${path.basename(destPath)} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
          resolve();
        });
      });
    }).on('error', (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });
  });
}

async function run() {
  console.log('Downloading Pretendard fonts to public/fonts ...');
  for (const item of fontItems) {
    const dest = path.join(fontsDir, item.name);
    try {
      await downloadFile(item.url, dest);
    } catch (e) {
      console.error(`Failed ${item.name}:`, e.message);
    }
  }
  console.log('Pretendard download process completed.');
}

run();
