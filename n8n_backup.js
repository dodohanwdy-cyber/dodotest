const fs = require('fs');
const https = require('https');
const path = require('path');

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjOTgwOGZmMy03YmJmLTRjZTQtYTYxNy1jZTQ2ZjRjM2FjNTgiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzY5Njc3MjE1fQ.pI8-m8IOq-L_Mt7WAoqh6DEey6ABiQjssZI695suJfM";
const url = "https://primary-production-1f39e.up.railway.app/api/v1/workflows";
const backupDir = "G:\\재택근무\\n8n-data\\n8n 백업";

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

function fetchWorkflows(currentUrl) {
    return new Promise((resolve, reject) => {
        https.get(currentUrl, { headers: { 'X-N8N-API-KEY': token } }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        }).on('error', reject);
    });
}

async function run() {
    let allWorkflows = [];
    let currentUrl = url;
    while(currentUrl) {
        let res = await fetchWorkflows(currentUrl);
        if (res.data) allWorkflows.push(...res.data);
        if (res.nextCursor) {
            currentUrl = url + '?cursor=' + res.nextCursor;
        } else {
            currentUrl = null;
        }
    }
    
    let count = 0;
    for (let wf of allWorkflows) {
        let cleanName = wf.name.replace(/[<>:"/\\|?*]/g, '_');
        fs.writeFileSync(path.join(backupDir, cleanName + '.json'), JSON.stringify(wf, null, 2));
        count++;
    }
    console.log(`Successfully backed up ${count} workflows to ${backupDir}`);
}

run().catch(console.error);
