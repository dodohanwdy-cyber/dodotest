import fs from 'fs';
import path from 'path';
import https from 'https';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const fontList = [
  {
    name: 'Griun_Fromsol-Rg.woff2',
    url: 'https://cdn.jsdelivr.net/gh/Project-Noonnu/2607161334@griun-fromsol-rg/griun-fromsol-rg/Griun_Fromsol-Rg.woff2',
  },
  {
    name: 'SUIT-Variable.woff2',
    url: 'https://cdn.jsdelivr.net/gh/sun-typeface/SUIT/fonts/variable/woff2/SUIT-Variable.woff2',
  },
  {
    name: 'Cafe24Ssurround.woff',
    url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2105_2@1.0/Cafe24Ssurround.woff',
  },
  {
    name: 'MaruBuri.woff',
    url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_20-10-21@1.0/MaruBuri-Regular.woff',
  },
  {
    name: 'GmarketSansBold.woff',
    url: 'https://cdn.jsdelivr.net/gh/projectnoonnu/noonfonts_2001@1.1/GmarketSansBold.woff',
  },
];

function downloadFont(item) {
  return new Promise((resolve, reject) => {
    const dest = path.join(fontsDir, item.name);
    const file = fs.createWriteStream(dest);

    https.get(item.url, (response) => {
      // 리다이렉트 처리
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        https.get(response.headers.location, (res2) => {
          res2.pipe(file);
          file.on('finish', () => {
            file.close();
            const stat = fs.statSync(dest);
            console.log(`[Success] ${item.name} (${(stat.size / 1024).toFixed(1)} KB)`);
            resolve();
          });
        }).on('error', reject);
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        const stat = fs.statSync(dest);
        console.log(`[Success] ${item.name} (${(stat.size / 1024).toFixed(1)} KB)`);
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      console.error(`[Error] ${item.name}:`, err.message);
      reject(err);
    });
  });
}

async function run() {
  console.log('Starting font download into public/fonts ...');
  for (const font of fontList) {
    try {
      await downloadFont(font);
    } catch (e) {
      console.error(`Failed ${font.name}:`, e.message);
    }
  }
  console.log('Font downloads complete.');
}

run();
