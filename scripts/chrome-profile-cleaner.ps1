<#
.SYNOPSIS
  Chrome Profile Cleaner — list, select, and mass-remove Chrome profiles.
.DESCRIPTION
  Reads Chrome's Local State file to enumerate all profiles, shows an interactive
  checklist, and deletes the profile folders you select. Chrome should be closed
  before running this.
.NOTES
  Run in PowerShell. Right-click the file -> Run with PowerShell, or run:
    powershell -ExecutionPolicy Bypass -File .\chrome-profile-cleaner.ps1
#>

$ErrorActionPreference = 'Stop'

$chromeDataPath = Join-Path $env:LOCALAPPDATA 'Google\Chrome\User Data'
$localStatePath = Join-Path $chromeDataPath 'Local State'

if (-not (Test-Path $localStatePath)) {
    Write-Host "Chrome Local State not found at: $localStatePath" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Parse Local State to get profile info
$localState = Get-Content $localStatePath -Raw | ConvertFrom-Json
$profileInfo = $localState.profile.info_cache

# Build list of profiles
$profiles = @()
foreach ($prop in $profileInfo.PSObject.Properties) {
    $folderName = $prop.Name
    $display = $prop.Value.name
    if (-not $display) { $display = $folderName }
    $folderPath = Join-Path $chromeDataPath $folderName
    $exists = Test-Path $folderPath
    $sizeMB = 0
    if ($exists) {
        $sizeBytes = (Get-ChildItem $folderPath -Recurse -File -ErrorAction SilentlyContinue |
            Measure-Object -Property Length -Sum).Sum
        if ($sizeBytes) { $sizeMB = [math]::Round($sizeBytes / 1MB, 1) }
    }
    $profiles += [PSCustomObject]@{
        Index       = $profiles.Count + 1
        Folder      = $folderName
        Name        = $display
        SizeMB      = $sizeMB
        Exists      = $exists
        Path        = $folderPath
    }
}

if ($profiles.Count -eq 0) {
    Write-Host "No Chrome profiles found." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

# Display profiles
Write-Host ""
Write-Host "===== Chrome Profile Cleaner =====" -ForegroundColor Cyan
Write-Host "Found $($profiles.Count) profile(s):" -ForegroundColor White
Write-Host ""
$profiles | ForEach-Object {
    $sizeStr = if ($_.SizeMB -gt 0) { "$($_.SizeMB) MB" } else { "N/A" }
    $existsStr = if ($_.Exists) { "OK" } else { "MISSING" }
    Write-Host ("  [{0,2}] {1,-30} ({2})  {3,8}  {4}" -f $_.Index, $_.Name, $_.Folder, $sizeStr, $existsStr)
}
Write-Host ""
Write-Host "Enter the numbers of profiles to DELETE, separated by commas (e.g. 1,3,5)."
Write-Host "Type 'all' to delete every profile. Type 'q' to quit without changes."
$choice = Read-Host "Selection"

if ($choice -eq 'q' -or $choice -eq '') {
    Write-Host "No changes made. Exiting." -ForegroundColor Green
    exit 0
}

# Determine which to delete
$toDelete = @()
if ($choice -eq 'all') {
    $toDelete = $profiles
} else {
    $indices = $choice.Split(',') | ForEach-Object { $_.Trim() } | Where-Object { $_ -match '^\d+$' } | ForEach-Object { [int]$_ }
    foreach ($i in $indices) {
        $p = $profiles | Where-Object { $_.Index -eq $i }
        if ($p) { $toDelete += $p }
    }
}

if ($toDelete.Count -eq 0) {
    Write-Host "No valid profiles selected. Exiting." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 0
}

# Confirm
Write-Host ""
Write-Host "You are about to DELETE these $($toDelete.Count) profile(s):" -ForegroundColor Yellow
$toDelete | ForEach-Object {
    Write-Host "  - $($_.Name) ($($_.Folder))  [$($_.SizeMB) MB]" -ForegroundColor White
}
Write-Host ""
Write-Host "WARNING: This permanently deletes profile data (bookmarks, history, extensions, etc)." -ForegroundColor Red
$confirm = Read-Host "Type 'DELETE' to confirm"

if ($confirm -ne 'DELETE') {
    Write-Host "Cancelled. No changes made." -ForegroundColor Green
    Read-Host "Press Enter to exit"
    exit 0
}

# Delete
$deleted = 0
$failed = 0
foreach ($p in $toDelete) {
    if (-not $p.Exists) {
        Write-Host "  SKIP (missing): $($p.Name)" -ForegroundColor DarkGray
        continue
    }
    try {
        Remove-Item -Path $p.Path -Recurse -Force -ErrorAction Stop
        Write-Host "  DELETED: $($p.Name) ($($p.Folder))" -ForegroundColor Green
        $deleted++
    } catch {
        Write-Host "  FAILED: $($p.Name) - $($_.Exception.Message)" -ForegroundColor Red
        $failed++
    }
}

# Clean up entries from Local State so Chrome doesn't show ghost profiles
try {
    $localState = Get-Content $localStatePath -Raw | ConvertFrom-Json
    foreach ($p in $toDelete) {
        if ($localState.profile.info_cache.PSObject.Properties.Name -contains $p.Folder) {
            $localState.profile.info_cache.PSObject.Properties.Remove($p.Folder)
        }
    }
    $localState | ConvertTo-Json -Depth 10 | Set-Content $localStatePath -Encoding UTF8
    Write-Host "Cleaned up Local State entries." -ForegroundColor Green
} catch {
    Write-Host "Could not clean Local State (Chrome may fix it on next launch)." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Done. Deleted: $deleted, Failed: $failed." -ForegroundColor Cyan
Read-Host "Press Enter to exit"