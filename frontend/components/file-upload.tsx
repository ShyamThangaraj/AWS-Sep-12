"use client"

import { useCallback, useState } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Upload, File, X, FileText, ImageIcon, FileSpreadsheet } from "lucide-react"
import { cn } from "@/lib/utils"

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  uploadedFiles: File[]
}

const getFileIcon = (file: File) => {
  if (file.type.startsWith("image/")) return <ImageIcon className="h-4 w-4" />
  if (file.type.includes("pdf")) return <FileText className="h-4 w-4" />
  if (file.type.includes("document") || file.type.includes("docx")) return <FileText className="h-4 w-4" />
  if (file.type.includes("spreadsheet") || file.type.includes("xlsx")) return <FileSpreadsheet className="h-4 w-4" />
  return <File className="h-4 w-4" />
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes"
  const k = 1024
  const sizes = ["Bytes", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Number.parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i]
}

export function FileUpload({ onFilesChange, uploadedFiles }: FileUploadProps) {
  const [isDragActive, setIsDragActive] = useState(false)

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...uploadedFiles, ...acceptedFiles]
      onFilesChange(newFiles)
    },
    [uploadedFiles, onFilesChange],
  )

  const removeFile = (index: number) => {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    onFilesChange(newFiles)
  }

  const { getRootProps, getInputProps, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp"],
      "application/pdf": [".pdf"],
      "application/msword": [".doc"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
      "application/vnd.ms-excel": [".xls"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
      "text/plain": [".txt"],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  })

  return (
    <div className="space-y-4">
      <Card
        {...getRootProps()}
        className={cn(
          "border-2 border-dashed transition-all duration-300 cursor-pointer law-firm-hover",
          isDragActive && "border-accent bg-accent/5",
          isDragAccept && "border-green-500 bg-green-50",
          isDragReject && "border-red-500 bg-red-50",
          !isDragActive && "border-border/50 hover:border-accent/50",
        )}
      >
        <CardContent className="p-8 text-center">
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold font-[family-name:var(--font-space-grotesk)] mb-2">
            Upload Supporting Documents
          </h3>
          <p className="text-muted-foreground mb-4">Drag & drop files here, or click to select files</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            <Badge variant="outline">PDF</Badge>
            <Badge variant="outline">DOCX</Badge>
            <Badge variant="outline">Images</Badge>
            <Badge variant="outline">TXT</Badge>
          </div>
          <p className="text-sm text-muted-foreground">Maximum file size: 10MB per file</p>
        </CardContent>
      </Card>

      {/* Uploaded Files List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Uploaded Files ({uploadedFiles.length})</h4>
          <div className="space-y-2">
            {uploadedFiles.map((file, index) => (
              <Card key={index} className="border-border/50">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className="text-muted-foreground">{getFileIcon(file)}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(file.size)}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
