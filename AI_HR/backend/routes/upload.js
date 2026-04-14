const express = require('express')
const path = require('path')
const { protect } = require('../middleware/auth')
const { asyncHandler } = require('../middleware/errorHandler')

const router = express.Router()

// All routes are protected
router.use(protect)

// @desc    Upload file
// @route   POST /api/upload
// @access  Private
const uploadFile = asyncHandler(async (req, res) => {
  if (!req.files || Object.keys(req.files).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'No files were uploaded'
    })
  }

  const file = req.files.file
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf', 'text/csv']
  const maxSize = 10 * 1024 * 1024 // 10MB

  // Validate file type
  if (!allowedTypes.includes(file.mimetype)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid file type. Allowed: JPEG, PNG, PDF, CSV'
    })
  }

  // Validate file size
  if (file.size > maxSize) {
    return res.status(400).json({
      success: false,
      message: 'File size too large. Maximum 10MB allowed'
    })
  }

  // Generate unique filename
  const fileExtension = path.extname(file.name)
  const fileName = `${req.user.id}_${Date.now()}${fileExtension}`
  const uploadPath = path.join(__dirname, '../uploads', fileName)

  try {
    // Move file to uploads directory
    await file.mv(uploadPath)

    // Update user storage usage
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { 'usage.storageUsed': Math.round(file.size / (1024 * 1024)) } // Convert to MB
    })

    res.json({
      success: true,
      message: 'File uploaded successfully',
      file: {
        name: fileName,
        originalName: file.name,
        size: file.size,
        mimetype: file.mimetype,
        url: `/uploads/${fileName}`
      }
    })
  } catch (error) {
    console.error('File upload error:', error)
    res.status(500).json({
      success: false,
      message: 'Error uploading file'
    })
  }
})

// @desc    Process CSV file
// @route   POST /api/upload/csv
// @access  Private
const processCSV = asyncHandler(async (req, res) => {
  if (!req.files || !req.files.csvFile) {
    return res.status(400).json({
      success: false,
      message: 'No CSV file uploaded'
    })
  }

  const csvFile = req.files.csvFile

  // Validate file type
  if (csvFile.mimetype !== 'text/csv' && !csvFile.name.endsWith('.csv')) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a valid CSV file'
    })
  }

  try {
    const csvData = csvFile.data.toString('utf8')
    const lines = csvData.split('\n').filter(line => line.trim())

    if (lines.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'CSV file is empty'
      })
    }

    // Parse CSV headers
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))

    // Validate required columns
    const requiredColumns = ['name', 'email']
    const missingColumns = requiredColumns.filter(col => 
      !headers.some(header => header.includes(col))
    )

    if (missingColumns.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Missing required columns: ${missingColumns.join(', ')}`
      })
    }

    // Process data rows
    const candidates = []
    const errors = []

    for (let i = 1; i < lines.length && i <= 1000; i++) { // Limit to 1000 rows
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))

      if (values.length !== headers.length) {
        errors.push(`Row ${i + 1}: Column count mismatch`)
        continue
      }

      const candidate = {}
      headers.forEach((header, index) => {
        if (header.includes('name')) candidate.name = values[index]
        else if (header.includes('email')) candidate.email = values[index]
        else if (header.includes('phone')) candidate.phone = values[index]
        else if (header.includes('position')) candidate.position = values[index]
        else if (header.includes('department')) candidate.department = values[index]
      })

      // Validate required fields
      if (!candidate.name || !candidate.email) {
        errors.push(`Row ${i + 1}: Missing name or email`)
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(candidate.email)) {
        errors.push(`Row ${i + 1}: Invalid email format`)
        continue
      }

      candidate.id = i
      candidates.push(candidate)
    }

    res.json({
      success: true,
      message: `CSV processed successfully. ${candidates.length} valid candidates found.`,
      data: {
        candidates,
        errors: errors.slice(0, 10), // Limit errors shown
        totalRows: lines.length - 1,
        validRows: candidates.length,
        errorCount: errors.length
      }
    })

  } catch (error) {
    console.error('CSV processing error:', error)
    res.status(500).json({
      success: false,
      message: 'Error processing CSV file'
    })
  }
})

router.post('/', uploadFile)
router.post('/csv', processCSV)

module.exports = router