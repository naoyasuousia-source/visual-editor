# Update all relative imports to use @/ alias
Get-ChildItem -Path "src\v2" -Recurse -Include *.ts,*.tsx | ForEach-Object {
    $content = Get-Content $_.FullName -Raw -Encoding UTF8
    $updated = $content
    
    # Replace ../../../ with @/
    $updated = $updated -replace "from\s+(['\`"])\.\.\.\/\.\.\.\/", 'from $1@/'
    
    # Replace ../../ with @/
    $updated = $updated -replace "from\s+(['\`"])\.\.\.\/\.\./", 'from $1@/'
    
    # Replace ../ with @/
    $updated = $updated -replace "from\s+(['\`"])\.\.\./", 'from $1@/'
    
    if ($content -ne $updated) {
        Set-Content -Path $_.FullName -Value $updated -NoNewline -Encoding UTF8
        Write-Output "Updated: $($_.FullName)"
    }
}
Write-Output "Import path update complete!"
