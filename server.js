import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Import all Netlify functions as Express routes
const functions = [
  'admin-login',
  'db-auth-login',
  'personnel-login',
  'personnel-add',
  'personnel-update',
  'personnel-delete',
  'personnel-detail',
  'personnel-update-shift',
  'personnel-import-excel',
  'personnel-export',
  'attendance-check',
  'attendance-list',
  'attendance-quick-check',
  'db-attendance-check',
  'check-active-status',
  'location-add',
  'location-update',
  'location-delete',
  'qr-generate',
  'qr-validate',
  'payroll-list',
  'payroll-calculate',
  'payroll-approve',
  'leave-list',
  'leave-start',
  'leave-end',
  'leave-update',
  'leave-management',
  'advance-manage',
  'salary-adjustment',
  'get-adjustments',
  'approve-adjustment',
  'absence-management',
  'reports-attendance',
  'reports-personnel',
  'reports-location',
  'get-dashboard-stats',
  'auth-login',
  'auth-verify'
];

// Dynamic function loader
async function loadFunctions() {
  for (const funcName of functions) {
    try {
      const modulePath = `./netlify/functions/${funcName}.js`;
      const module = await import(modulePath);
      const handler = module.handler || module.default?.handler || module.default;
      
      if (handler) {
        // Create Express route for each function
        app.all(`/.netlify/functions/${funcName}`, async (req, res) => {
          try {
            const event = {
              httpMethod: req.method,
              headers: req.headers,
              body: JSON.stringify(req.body),
              queryStringParameters: req.query,
              path: req.path
            };
            
            const result = await handler(event, {});
            
            // Set headers
            if (result.headers) {
              Object.entries(result.headers).forEach(([key, value]) => {
                res.setHeader(key, value);
              });
            }
            
            res.status(result.statusCode || 200);
            
            if (result.body) {
              try {
                res.json(JSON.parse(result.body));
              } catch {
                res.send(result.body);
              }
            } else {
              res.end();
            }
          } catch (error) {
            console.error(`Error in ${funcName}:`, error);
            res.status(500).json({ error: error.message });
          }
        });
        
        console.log(`✅ Loaded: ${funcName}`);
      }
    } catch (error) {
      console.log(`⚠️ Could not load ${funcName}: ${error.message}`);
    }
  }
}

// Serve static files in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, 'dist')));
  
  // SPA fallback
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/.netlify/functions')) {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    }
  });
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server
async function start() {
  await loadFunctions();
  
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`
🚀 Server running on http://localhost:${PORT}
📡 API: http://localhost:${PORT}/.netlify/functions/
🏥 Health: http://localhost:${PORT}/health
    `);
  });
}

start().catch(console.error);
