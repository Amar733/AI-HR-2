import { useState, useRef } from 'react'
import { Card, Form, Button, Alert, Table, Badge, ProgressBar } from 'react-bootstrap'
import { useLoading } from '../../contexts/LoadingContext'

export default function CSVUpload({ onUpload, onCancel }) {
  const [file, setFile] = useState(null)
  const [csvData, setCsvData] = useState([])
  const [errors, setErrors] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const fileInputRef = useRef()
  const { setIsLoading } = useLoading()

  const handleFileSelect = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      processCSV(selectedFile)
    } else {
      alert('Please select a valid CSV file')
    }
  }

  const processCSV = (file) => {
    setIsProcessing(true)
    setUploadProgress(0)

    const reader = new FileReader()
    reader.onload = (e) => {
      const csvText = e.target.result
      parseCsvData(csvText)
      setIsProcessing(false)
      setUploadProgress(100)
    }
    reader.readAsText(file)
  }

  const parseCsvData = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim())
    if (lines.length === 0) return

    const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''))
    const candidates = []
    const parseErrors = []

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))

      if (values.length !== headers.length) {
        parseErrors.push(`Row ${i + 1}: Column count mismatch`)
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
        parseErrors.push(`Row ${i + 1}: Missing name or email`)
        continue
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(candidate.email)) {
        parseErrors.push(`Row ${i + 1}: Invalid email format`)
        continue
      }

      candidates.push({ ...candidate, row: i + 1 })
    }

    setCsvData(candidates)
    setErrors(parseErrors)
  }

  const handleUpload = () => {
    if (csvData.length === 0) return

    setIsLoading(true)
    onUpload(csvData)
  }

  const downloadTemplate = () => {
    const template = 'Name,Email,Phone,Position,Department\nJohn Doe,john@example.com,+1234567890,Software Engineer,Engineering\nJane Smith,jane@example.com,+0987654321,Product Manager,Product'

    const blob = new Blob([template], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'interview_candidates_template.csv'
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="csv-upload">
      <Card>
        <Card.Body>
          <div className="text-center mb-4">
            <i className="bi bi-file-earmark-spreadsheet display-4 text-primary mb-3"></i>
            <h5>Upload Candidates from CSV</h5>
            <p className="text-muted">
              Import multiple candidates at once using a CSV file
            </p>
          </div>

          {!file && (
            <div className="upload-area text-center p-5 border-2 border-dashed rounded mb-3">
              <i className="bi bi-cloud-upload display-4 text-muted mb-3"></i>
              <h6>Choose CSV File</h6>
              <p className="text-muted mb-3">
                Select a CSV file with candidate information
              </p>
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                Browse Files
              </Button>
              <Form.Control
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                style={{ display: 'none' }}
              />
            </div>
          )}

          {isProcessing && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-2">
                <span>Processing CSV...</span>
                <span>{uploadProgress}%</span>
              </div>
              <ProgressBar now={uploadProgress} />
            </div>
          )}

          {errors.length > 0 && (
            <Alert variant="warning" className="mb-3">
              <Alert.Heading>Processing Errors</Alert.Heading>
              <ul className="mb-0">
                {errors.slice(0, 5).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 5 && <li>... and {errors.length - 5} more errors</li>}
              </ul>
            </Alert>
          )}

          {csvData.length > 0 && (
            <div className="mb-3">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6>Preview ({csvData.length} candidates found)</h6>
                <Badge bg="success">{csvData.length} valid</Badge>
              </div>

              <div className="table-responsive" style={{ maxHeight: '300px' }}>
                <Table striped bordered hover size="sm">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Position</th>
                      <th>Department</th>
                    </tr>
                  </thead>
                  <tbody>
                    {csvData.slice(0, 10).map((candidate, index) => (
                      <tr key={index}>
                        <td>{candidate.name}</td>
                        <td>{candidate.email}</td>
                        <td>{candidate.phone || '-'}</td>
                        <td>{candidate.position || '-'}</td>
                        <td>{candidate.department || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              </div>

              {csvData.length > 10 && (
                <small className="text-muted">
                  Showing first 10 candidates. Total: {csvData.length}
                </small>
              )}
            </div>
          )}

          <div className="d-flex justify-content-between align-items-center">
            <Button variant="link" onClick={downloadTemplate} className="p-0">
              <i className="bi bi-download me-1"></i>
              Download Template
            </Button>

            <div className="d-flex gap-2">
              <Button variant="outline-secondary" onClick={onCancel}>
                Cancel
              </Button>
              {csvData.length > 0 && (
                <Button 
                  variant="success" 
                  onClick={handleUpload}
                  disabled={csvData.length === 0}
                >
                  Upload {csvData.length} Candidates
                </Button>
              )}
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  )
}