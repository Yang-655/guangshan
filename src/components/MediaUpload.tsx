import React, { useState, useRef, useCallback } from 'react';
import { Upload, X, Play, Image, FileVideo, AlertCircle, CheckCircle, Eye, FileText, FileSpreadsheet, Presentation } from 'lucide-react';
import MediaPreview from './MediaPreview';

interface MediaFile {
  id: string;
  file: File;
  url: string;
  type: 'image' | 'video' | 'document';
  progress?: number;
  error?: string;
}

interface MediaUploadProps {
  onFilesChange: (files: MediaFile[]) => void;
  maxFiles?: number;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
  className?: string;
  label?: string;
  required?: boolean;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesChange,
  maxFiles = 10,
  maxSize = 100, // 100MB
  acceptedTypes = [
    'image/jpeg', 'image/png', 'image/gif', 
    'video/mp4', 'video/mov', 'video/avi',
    'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ],
  className = '',
  label = '上传文件',
  required = false
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);
  const [previewIndex, setPreviewIndex] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): string | null => {
    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    
    // 检查MIME类型
    const isValidMimeType = acceptedTypes.includes(fileType);
    
    // 检查文件扩展名（作为备用验证）
    const validExtensions = [
      '.jpg', '.jpeg', '.png', '.gif',
      '.mp4', '.mov', '.avi',
      '.ppt', '.pptx', '.doc', '.docx', '.xls', '.xlsx'
    ];
    const hasValidExtension = validExtensions.some(ext => fileName.endsWith(ext));
    
    if (!isValidMimeType && !hasValidExtension) {
      return '不支持的文件格式';
    }
    
    // 根据文件类型设置不同的大小限制
    const fileTypeCategory = getFileType(file);
    let sizeLimit = maxSize;
    
    // 办公文档通常较大，给予更宽松的限制
    if (fileTypeCategory === 'document') {
      sizeLimit = Math.max(maxSize, 200); // 至少200MB
    }
    
    if (file.size > sizeLimit * 1024 * 1024) {
      return `文件大小不能超过 ${sizeLimit}MB`;
    }
    
    return null;
  };

  const getFileType = (file: File): 'image' | 'video' | 'document' => {
    if (file.type.startsWith('image/')) {
      return 'image';
    } else if (file.type.startsWith('video/')) {
      return 'video';
    } else {
      return 'document';
    }
  };

  const getDocumentIcon = (file: File) => {
    const type = file.type;
    const name = file.name.toLowerCase();
    
    if (type.includes('presentation') || name.endsWith('.ppt') || name.endsWith('.pptx')) {
      return <Presentation className="w-8 h-8 text-orange-400" />;
    } else if (type.includes('word') || name.endsWith('.doc') || name.endsWith('.docx')) {
      return <FileText className="w-8 h-8 text-blue-400" />;
    } else if (type.includes('excel') || type.includes('spreadsheet') || name.endsWith('.xls') || name.endsWith('.xlsx')) {
      return <FileSpreadsheet className="w-8 h-8 text-green-400" />;
    } else {
      return <FileText className="w-8 h-8 text-gray-400" />;
    }
  };

  const processFiles = useCallback((fileList: FileList) => {
    const newFiles: MediaFile[] = [];
    const errors: string[] = [];

    Array.from(fileList).forEach((file) => {
      if (files.length + newFiles.length >= maxFiles) {
        errors.push(`最多只能上传 ${maxFiles} 个文件`);
        return;
      }

      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
        return;
      }

      const mediaFile: MediaFile = {
        id: Date.now() + Math.random().toString(),
        file,
        url: URL.createObjectURL(file),
        type: getFileType(file),
        progress: 0
      };

      newFiles.push(mediaFile);
    });

    if (errors.length > 0) {
      setUploadError(errors.join('; '));
    } else {
      setUploadError('');
    }

    if (newFiles.length > 0) {
      const updatedFiles = [...files, ...newFiles];
      setFiles(updatedFiles);
      onFilesChange(updatedFiles);

      // 模拟上传进度
      newFiles.forEach((mediaFile) => {
        simulateUpload(mediaFile.id);
      });
    }
  }, [files, maxFiles, maxSize, acceptedTypes, onFilesChange]);

  const simulateUpload = (fileId: string) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
      }

      setFiles(prev => prev.map(file => 
        file.id === fileId ? { ...file, progress } : file
      ));
    }, 200);
  };

  const removeFile = (fileId: string) => {
    const updatedFiles = files.filter(file => {
      if (file.id === fileId) {
        URL.revokeObjectURL(file.url);
        return false;
      }
      return true;
    });
    setFiles(updatedFiles);
    onFilesChange(updatedFiles);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // 重置input值，允许重复选择同一文件
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 标签 */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-300">
          {label}
          {required && <span className="text-red-400 ml-1">*</span>}
        </label>
      </div>

      {/* 上传区域 */}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging 
            ? 'border-blue-400 bg-blue-400/10' 
            : 'border-gray-600 hover:border-gray-500'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={files.length < maxFiles ? openFileDialog : undefined}
      >
        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-400 mb-1">
          {files.length >= maxFiles 
            ? `已达到最大文件数量 (${maxFiles})` 
            : '点击或拖拽文件到此处上传'
          }
        </p>
        <p className="text-xs text-gray-500">
          支持图片、视频、PPT、Word、Excel 格式，最大 {maxSize}MB
        </p>
      </div>

      {/* 隐藏的文件输入 */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* 错误信息 */}
      {uploadError && (
        <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-400">{uploadError}</span>
        </div>
      )}

      {/* 文件列表 */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-300">已上传文件 ({files.length}/{maxFiles})</h4>
          <div className="max-h-96 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 pr-2">
            {files.map((mediaFile) => (
              <div key={mediaFile.id} className="relative group">
                <div className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700">
                  {/* 文件预览 */}
                  <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
                    {mediaFile.type === 'image' ? (
                      <img
                        src={mediaFile.url}
                        alt={mediaFile.file.name}
                        className="w-full h-full object-cover"
                      />
                    ) : mediaFile.type === 'video' ? (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileVideo className="w-8 h-8 mb-2" />
                        <span className="text-xs text-center px-2">
                          {mediaFile.file.name}
                        </span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        {getDocumentIcon(mediaFile.file)}
                        <span className="text-xs text-center px-2 mt-2">
                          {mediaFile.file.name}
                        </span>
                      </div>
                    )}
                    
                    {/* 操作按钮 */}
                    <div className="absolute top-2 right-2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          const index = files.findIndex(f => f.id === mediaFile.id);
                          setPreviewIndex(index);
                          setShowPreview(true);
                        }}
                        className="w-6 h-6 bg-blue-500 hover:bg-blue-600 rounded-full flex items-center justify-center"
                        title="预览"
                      >
                        <Eye className="w-3 h-3 text-white" />
                      </button>
                      <button
                        onClick={() => removeFile(mediaFile.id)}
                        className="w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                        title="删除"
                      >
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* 文件信息 */}
                  <div className="p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-400 truncate flex-1">
                        {mediaFile.file.name}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">
                        {(mediaFile.file.size / 1024 / 1024).toFixed(1)}MB
                      </span>
                    </div>

                    {/* 上传进度 */}
                    {mediaFile.progress !== undefined && mediaFile.progress < 100 && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-400">上传中...</span>
                          <span className="text-xs text-gray-400">{Math.round(mediaFile.progress)}%</span>
                        </div>
                        <div className="w-full bg-gray-700 rounded-full h-1">
                          <div 
                            className="bg-blue-500 h-1 rounded-full transition-all duration-300"
                            style={{ width: `${mediaFile.progress}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* 上传完成 */}
                    {mediaFile.progress === 100 && (
                      <div className="flex items-center gap-1 text-green-400">
                        <CheckCircle className="w-3 h-3" />
                        <span className="text-xs">上传完成</span>
                      </div>
                    )}

                    {/* 错误信息 */}
                    {mediaFile.error && (
                      <div className="flex items-center gap-1 text-red-400">
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-xs">{mediaFile.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>
      )}

      {/* 文件预览 */}
      {showPreview && files.length > 0 && (
        <MediaPreview
          files={files}
          initialIndex={previewIndex}
          onClose={() => setShowPreview(false)}
          showDownload={true}
        />
      )}
    </div>
  );
};

export default MediaUpload;
export type { MediaFile };