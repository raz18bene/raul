// Configurare Supabase - pentru folderul static/config.js
const SUPABASE_CONFIG = {
    url: 'https://iztqphtcltvprxcbdmzd.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6dHFwaHRjbHR2cHJ4Y2JkbXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg5MDEwMzEsImV4cCI6MjA4NDQ3NzAzMX0.73gZrX_Ru0Gari6moAw-2sK0V85kJoTXpKoLEKlTecQ',
    serviceRoleKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml6dHFwaHRjbHR2cHJ4Y2JkbXpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODkwMTAzMSwiZXhwIjoyMDg0NDc3MDMxfQ.Eb08Xw-ki0UO11-B9Cm9QLOZnnIYhBKrGOFcvjdiRJ0'
};

// Export configurări
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SUPABASE_CONFIG };
}

