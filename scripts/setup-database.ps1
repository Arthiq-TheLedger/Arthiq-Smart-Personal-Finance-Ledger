# Arthiq — PostgreSQL database setup script
# Usage: .\scripts\setup-database.ps1 -Password "your_postgres_password"

param(
    [Parameter(Mandatory = $true)]
    [string]$Password
)

$psql = "C:\Program Files\PostgreSQL\18\bin\psql.exe"
$schema = Join-Path $PSScriptRoot "..\database\schema.sql"
$env:PGPASSWORD = $Password

Write-Host "Creating database 'arthiq' (if not exists)..." -ForegroundColor Cyan
& $psql -U postgres -h localhost -p 5432 -c "SELECT 1 FROM pg_database WHERE datname = 'arthiq'" -t | ForEach-Object {
    if ($_.Trim() -ne "1") {
        & $psql -U postgres -h localhost -p 5432 -c "CREATE DATABASE arthiq;"
        if ($LASTEXITCODE -ne 0) { Write-Error "Failed to create database"; exit 1 }
        Write-Host "Database created." -ForegroundColor Green
    } else {
        Write-Host "Database already exists." -ForegroundColor Yellow
    }
}

Write-Host "Running schema..." -ForegroundColor Cyan
& $psql -U postgres -h localhost -p 5432 -d arthiq -f $schema
if ($LASTEXITCODE -ne 0) { Write-Error "Schema failed"; exit 1 }

Write-Host "Updating backend/.env with your password..." -ForegroundColor Cyan
$envFile = Join-Path $PSScriptRoot "..\backend\.env"
$content = Get-Content $envFile -Raw
$encoded = [uri]::EscapeDataString($Password)
$content = $content -replace 'postgresql://postgres:[^@]+@', "postgresql://postgres:${encoded}@"
Set-Content $envFile $content.TrimEnd() -NoNewline

Write-Host "Done! Database is ready." -ForegroundColor Green
Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
