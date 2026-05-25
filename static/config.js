// Configurare Supabase - pentru folderul static/config.js
const SUPABASE_CONFIG = {
    url: 'https://blykqidmtdadvocvfilm.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWtxaWRtdGRhZHZvY3ZmaWxtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk2OTk4NzEsImV4cCI6MjA5NTI3NTg3MX0.Np1MM6u-d2Hdwabk2hhJqaaeO-APdaAenhmFihLddzU',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJseWtxaWRtdGRhZHZvY3ZmaWxtIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTY5OTg3MSwiZXhwIjoyMDk1Mjc1ODcxfQ.UdlGkv4B9uhVYkfubMtzNORax8Ur4Ii_K5V8ZVzIvig'
};

// Export configurări
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG };
}