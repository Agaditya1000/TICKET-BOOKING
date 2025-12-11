# PowerShell script to run database migrations on Neon
# Usage: .\run-migration-neon.ps1

$connectionString = "postgresql://neondb_owner:npg_On4PqTe6LjHV@ep-jolly-lab-ah2ku3qx-pooler.c-3.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
$migrationFile = "migrations\001_create_tables.sql"

Write-Host "Running database migration on Neon..." -ForegroundColor Green
Write-Host "Connection: $connectionString" -ForegroundColor Yellow
Write-Host "Migration file: $migrationFile" -ForegroundColor Yellow
Write-Host ""

# Check if psql is available
$psqlPath = Get-Command psql -ErrorAction SilentlyContinue
if (-not $psqlPath) {
    Write-Host "ERROR: psql command not found!" -ForegroundColor Red
    Write-Host "Please install PostgreSQL client tools or use Neon SQL Editor instead." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Alternative: Copy the SQL from migrations/001_create_tables.sql" -ForegroundColor Cyan
    Write-Host "and paste it into Neon SQL Editor (https://console.neon.tech)" -ForegroundColor Cyan
    exit 1
}

# Run migration
try {
    $env:PGPASSWORD = "npg_On4PqTe6LjHV"
    psql $connectionString -f $migrationFile
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "❌ Migration failed. Check the error above." -ForegroundColor Red
    }
} catch {
    Write-Host ""
    Write-Host "❌ Error running migration: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternative: Use Neon SQL Editor:" -ForegroundColor Yellow
    Write-Host "1. Go to https://console.neon.tech" -ForegroundColor Cyan
    Write-Host "2. Open SQL Editor" -ForegroundColor Cyan
    Write-Host "3. Copy contents of migrations/001_create_tables.sql" -ForegroundColor Cyan
    Write-Host "4. Paste and run" -ForegroundColor Cyan
} finally {
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
