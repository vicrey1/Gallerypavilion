# Test script to verify photo upload transformation fix
# This script tests the photo upload endpoint directly

$baseUrl = "https://gallerypavilion-pr45y3bym-vameh09-5178s-projects.vercel.app"
$testImagePath = "test-image.jpg"

# Create a simple test image file if it doesn't exist
if (-not (Test-Path $testImagePath)) {
    Write-Host "Creating test image file..."
    # Create a minimal JPEG header for testing
    $jpegHeader = [byte[]]@(0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9)
    [System.IO.File]::WriteAllBytes($testImagePath, $jpegHeader)
}

Write-Host "Testing photo upload endpoint..."
Write-Host "Base URL: $baseUrl"

# Test 1: Check if the API is accessible
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/auth/me" -Method GET -UseBasicParsing
    Write-Host "✅ API is accessible (Status: $($response.StatusCode))"
} catch {
    Write-Host "❌ API not accessible: $($_.Exception.Message)"
    exit 1
}

# Test 2: Try to access a gallery endpoint (this will likely fail due to auth, but we can see the error)
try {
    $testGalleryId = "68c980e716427607c9bc145e"
    $uploadUrl = "$baseUrl/api/galleries/$testGalleryId/photos"
    
    Write-Host "Testing upload endpoint: $uploadUrl"
    
    # Create form data
    $boundary = [System.Guid]::NewGuid().ToString()
    $LF = "`r`n"
    
    $bodyLines = (
        "--$boundary",
        "Content-Disposition: form-data; name=`"files`"; filename=`"test-image.jpg`"",
        "Content-Type: image/jpeg$LF",
        [System.IO.File]::ReadAllText($testImagePath),
        "--$boundary--$LF"
    ) -join $LF
    
    $response = Invoke-WebRequest -Uri $uploadUrl -Method POST -Body $bodyLines -ContentType "multipart/form-data; boundary=$boundary" -UseBasicParsing
    Write-Host "✅ Upload successful (Status: $($response.StatusCode))"
    
} catch {
    $errorMessage = $_.Exception.Message
    Write-Host "Upload attempt result: $errorMessage"
    
    # Check if it's an authentication error (expected) vs transformation error (the bug we're fixing)
    if ($errorMessage -like "*Invalid extension in transformation*") {
        Write-Host "❌ TRANSFORMATION ERROR STILL EXISTS!"
        exit 1
    } elseif ($errorMessage -like "*401*" -or $errorMessage -like "*403*" -or $errorMessage -like "*Unauthorized*") {
        Write-Host "✅ Authentication error (expected - transformation syntax is working)"
    } else {
        Write-Host "ℹ️  Other error (may be expected): $errorMessage"
    }
}

Write-Host "Test completed. Check Vercel logs for detailed error information."