import { Camera as CameraIcon, RotateCcw, Zap, ZapOff, Circle, Square, ArrowLeft, Image, Video, Upload, FlipHorizontal, Smartphone, Monitor, Sparkles } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdvancedVideoEditor from '../components/AdvancedVideoEditor';
import VideoPublish from '../components/VideoPublish';
import PhotoEditor from '../components/PhotoEditor';
import CameraEffectsPanel from '../components/CameraEffectsPanel';
import { useToast } from '../components/Toast';
import { recommendationService } from '../utils/recommendationService';

export default function Camera() {
  const navigate = useNavigate();
  const { success, info, warning } = useToast();
  const [mode, setMode] = useState<'video' | 'photo'>('video');
  const [isRecording, setIsRecording] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<'front' | 'back'>('front');
  const [isMirrorEnabled, setIsMirrorEnabled] = useState(true); // 前置摄像头默认开启镜像
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentStep, setCurrentStep] = useState<'camera' | 'editor' | 'publish' | 'photo_editor'>('camera');
  const [recordedVideo, setRecordedVideo] = useState<string | null>(null);
  const [editedVideo, setEditedVideo] = useState<any>(null);
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'requesting' | 'active' | 'capturing' | 'preview' | 'error'>('idle');
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);
  const [showPhotoPreview, setShowPhotoPreview] = useState(false);
  
  // 特效面板状态
  const [showEffectsPanel, setShowEffectsPanel] = useState(false);
  const [appliedEffects, setAppliedEffects] = useState<any>(null);
  const recordingInterval = useRef<NodeJS.Timeout | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [recordedVideoBlob, setRecordedVideoBlob] = useState<Blob | null>(null);

  const handleRecord = async () => {
    if (!isRecording) {
      // 开始录制前确保摄像头已启动
      if (cameraStatus === 'idle' || cameraStatus === 'error') {
        info('正在启动摄像头...');
        await startCamera();
      }
      
      // 检查摄像头是否成功启动
      if (cameraStatus !== 'active' || !cameraStream) {
        warning('摄像头未就绪，无法开始录制');
        return;
      }
      
      try {
        // 清空之前的录制数据
        setRecordedChunks([]);
        
        // 创建MediaRecorder实例
        const options = {
          mimeType: 'video/webm;codecs=vp9' // 优先使用VP9编码
        };
        
        // 检查浏览器支持的MIME类型
        let mimeType = 'video/webm;codecs=vp9';
        if (!MediaRecorder.isTypeSupported(mimeType)) {
          mimeType = 'video/webm;codecs=vp8';
          if (!MediaRecorder.isTypeSupported(mimeType)) {
            mimeType = 'video/webm';
            if (!MediaRecorder.isTypeSupported(mimeType)) {
              mimeType = 'video/mp4';
            }
          }
        }
        
        console.log('使用MIME类型:', mimeType);
        
        const mediaRecorder = new MediaRecorder(cameraStream, {
          mimeType: mimeType
        });
        
        mediaRecorderRef.current = mediaRecorder;
        
        // 设置数据可用事件处理
        mediaRecorder.ondataavailable = (event) => {
          if (event.data && event.data.size > 0) {
            console.log('录制数据块大小:', event.data.size);
            setRecordedChunks(prev => [...prev, event.data]);
          }
        };
        
        // 设置录制停止事件处理
        mediaRecorder.onstop = () => {
          console.log('MediaRecorder已停止');
          // 在这里处理录制完成的逻辑
          setTimeout(() => {
            setRecordedChunks(currentChunks => {
              if (currentChunks.length > 0) {
                console.log('录制完成，数据块数量:', currentChunks.length);
                
                // 创建视频Blob
                const videoBlob = new Blob(currentChunks, {
                  type: currentChunks[0]?.type || 'video/webm'
                });
                
                console.log('视频Blob大小:', videoBlob.size, 'bytes');
                
                // 保存原始Blob对象
                setRecordedVideoBlob(videoBlob);
                
                // 创建视频URL
                const videoUrl = URL.createObjectURL(videoBlob);
                console.log('生成视频URL:', videoUrl);
                
                setRecordedVideo(videoUrl);
                success('视频录制完成');
                setCurrentStep('editor');
                // 设置编辑状态
                localStorage.setItem('camera_editing', 'true');
              } else {
                console.error('没有录制到任何数据');
                warning('录制失败，没有录制到视频数据');
              }
              return currentChunks;
            });
          }, 100);
        };
        
        // 设置错误处理
        mediaRecorder.onerror = (event) => {
          console.error('录制错误:', event);
          warning('录制过程中发生错误');
          setIsRecording(false);
          localStorage.removeItem('camera_recording');
          if (recordingInterval.current) {
            clearInterval(recordingInterval.current);
            recordingInterval.current = null;
          }
        };
        
        // 开始录制
        mediaRecorder.start(1000); // 每秒生成一个数据块
        setIsRecording(true);
        localStorage.setItem('camera_recording', 'true');
        console.log('开始录制');
        info('开始录制视频');
        setRecordingTime(0);
        
        // 启动计时器
        recordingInterval.current = setInterval(() => {
          setRecordingTime(prev => {
            if (prev >= 60) {
              handleStopRecording();
              return 60;
            }
            return prev + 1;
          });
        }, 1000);
        
      } catch (error) {
        console.error('启动录制失败:', error);
        warning('启动录制失败，请重试');
      }
    } else {
      handleStopRecording();
    }
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    localStorage.removeItem('camera_recording');
    if (recordingInterval.current) {
      clearInterval(recordingInterval.current);
      recordingInterval.current = null;
    }
    
    // 停止MediaRecorder
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      // 录制完成的处理逻辑现在在onstop事件中进行
    } else {
      console.log('MediaRecorder未启动或已停止');
      warning('录制未正常启动');
    }
  };

  const handleEditorSave = (editedVideoData: any) => {
    setEditedVideo(editedVideoData);
    setCurrentStep('publish');
    // 清除编辑状态，设置发布状态
    localStorage.removeItem('camera_editing');
    localStorage.setItem('camera_publishing', 'true');
  };

  const handleEditorCancel = () => {
    // 清理localStorage状态
    localStorage.removeItem('camera_recording');
    localStorage.removeItem('camera_capturing');
    localStorage.removeItem('camera_editing');
    
    setCurrentStep('camera');
    setRecordedVideo(null);
    setRecordingTime(0);
    setRecordedChunks([]);
    setRecordedVideoBlob(null);
    
    // 延迟清理录制的视频URL
    setTimeout(() => {
      if (recordedVideo && recordedVideo.startsWith('blob:')) {
        console.log('取消编辑，清理blob URL:', recordedVideo);
        URL.revokeObjectURL(recordedVideo);
      }
    }, 100);
  };

  const handlePublish = async (publishData: any) => {
    console.log('发布视频:', publishData);
    console.log('录制的视频URL:', recordedVideo);
    console.log('处理后的视频URL:', publishData.videoUrl);
    console.log('编辑器数据:', editedVideo);
    
    try {
      // 添加用户ID和视频时长信息
      const enrichedPublishData = {
        ...publishData,
        userId: 'user_demo_001', // 统一使用user_demo_001作为演示用户ID
        duration: recordingTime || 60, // 使用实际录制时长
        // 优先使用VideoPublish组件处理后的URL，如果没有则使用原始URL
        videoUrl: publishData.videoUrl || recordedVideo,
        // 添加原始Blob对象作为备用数据源
        videoBlob: recordedVideoBlob,
        // 关键修复：添加编辑器生成的数据，包括封面
        editedVideo: editedVideo,
        createdAt: new Date().toISOString()
      };
      
      console.log('准备发布的数据:', enrichedPublishData);
      
      // 发布到推荐系统（现在是异步的）
      const videoId = await recommendationService.publishVideo(enrichedPublishData);
      console.log('视频处理结果，ID:', videoId);
      
      // 检查是否是草稿ID（草稿ID通常以draft_开头）
      if (videoId.startsWith('draft_')) {
        console.log('✅ 视频已保存为草稿，ID:', videoId);
        // 显示草稿保存成功的提示
        success('网络连接失败，视频已保存为草稿');
        
        // 清理状态并返回主页
         cleanupAndReturn();
         return;
      }
      
      // 验证视频是否真的被发布
      const savedVideo = await recommendationService.getVideoById(videoId);
      console.log('验证发布的视频:', savedVideo);
      
      // 检查视频URL是否已正确转换为base64
      if (savedVideo && savedVideo.videoUrl) {
        if (savedVideo.videoUrl.startsWith('data:video/')) {
          console.log('视频已成功转换为base64格式，大小:', Math.round(savedVideo.videoUrl.length / 1024), 'KB');
        } else if (savedVideo.videoUrl.startsWith('blob:')) {
          console.warn('警告：视频仍为blob格式，可能在页面刷新后失效');
        }
      }
      
      // 检查用户视频列表
      const userVideos = await recommendationService.getUserVideos('user_demo_001');
      console.log('用户视频列表:', userVideos.length, '个视频');
      
      // 清理localStorage状态
      localStorage.removeItem('camera_recording');
      localStorage.removeItem('camera_capturing');
      localStorage.removeItem('camera_editing');
      localStorage.removeItem('camera_publishing');
      
      // 重置状态
      setCurrentStep('camera');
      
      // 只有在视频已成功转换为base64后才清理blob URL
      if (recordedVideo && recordedVideo.startsWith('blob:')) {
        if (savedVideo && savedVideo.videoUrl && savedVideo.videoUrl.startsWith('data:video/')) {
          console.log('视频已转换为base64，安全清理blob URL:', recordedVideo);
          URL.revokeObjectURL(recordedVideo);
        } else {
          console.log('视频尚未转换为base64，延迟清理blob URL');
          // 延迟清理，给转换过程更多时间
          setTimeout(() => {
            console.log('延迟清理blob URL:', recordedVideo);
            URL.revokeObjectURL(recordedVideo);
          }, 5000);
        }
      }
      
      setRecordedVideo(null);
      setEditedVideo(null);
      setRecordingTime(0);
      setRecordedChunks([]);
      setRecordedVideoBlob(null);
      
      // 成功提示并导航到个人作品页面
      success('视频发布成功！正在跳转到个人作品页面...');
      
      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
      
    } catch (error) {
      console.error('发布视频失败:', error);
      warning('视频发布失败，请重试');
    }
  };

  const cleanupAndReturn = () => {
    // 清理localStorage状态
    localStorage.removeItem('camera_recording');
    localStorage.removeItem('camera_capturing');
    localStorage.removeItem('camera_editing');
    localStorage.removeItem('camera_publishing');
    
    // 重置状态
    setCurrentStep('camera');
    setRecordedVideo(null);
    setRecordingTime(0);
    setRecordedChunks([]);
    setRecordedVideoBlob(null);
    setEditedVideo(null);
    
    // 清理blob URL
    if (recordedVideo && recordedVideo.startsWith('blob:')) {
      URL.revokeObjectURL(recordedVideo);
    }
    
    // 导航回主页
    navigate('/');
  };

  const handlePublishCancel = () => {
    // 清理localStorage状态
    localStorage.removeItem('camera_recording');
    localStorage.removeItem('camera_capturing');
    localStorage.removeItem('camera_publishing');
    setCurrentStep('editor');
    // 重新设置编辑状态
    localStorage.setItem('camera_editing', 'true');
  };

  // 处理特效按钮点击
  const handleEffectsClick = () => {
    if (cameraStatus === 'active') {
      setShowEffectsPanel(true);
      info('特效面板已打开');
    } else {
      warning('请先启动摄像头');
    }
  };
  
  // 处理特效应用
  const handleEffectApplied = (effectData: any) => {
    setAppliedEffects(effectData);
    console.log('应用特效:', effectData);
  };

  const handlePhotoCapture = async () => {
    if (cameraStatus === 'idle' || cameraStatus === 'error') {
      // 首次点击或错误状态，启动摄像头
      await startCamera();
    } else if (cameraStatus === 'active') {
      // 摄像头已启动，进行拍照
      capturePhoto();
    } else if (cameraStatus === 'preview') {
      // 预览状态，重新拍照
      retakePhoto();
    } else if (cameraStatus === 'requesting' || cameraStatus === 'capturing') {
      // 正在处理中，提示用户等待
      info('正在处理中，请稍候...');
    }
  };

  // 视频模式下启动摄像头
  const handleVideoModeStart = async () => {
    if (mode === 'video' && (cameraStatus === 'idle' || cameraStatus === 'error')) {
      info('正在启动摄像头预览...');
      await startCamera();
    }
  };

  // 权限检查和设备枚举
  const checkCameraPermissions = async () => {
    try {
      if (!navigator.permissions) {
        console.log('浏览器不支持权限API');
        return 'unknown';
      }
      
      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      console.log('摄像头权限状态:', permission.state);
      return permission.state;
    } catch (error) {
      console.error('检查权限失败:', error);
      return 'unknown';
    }
  };

  const enumerateDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        console.log('浏览器不支持设备枚举');
        return [];
      }
      
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      console.log('可用摄像头设备:', videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('枚举设备失败:', error);
      return [];
    }
  };

  const startCamera = async (retryCount = 0, facing?: 'front' | 'back') => {
    const maxRetries = 3;
    const targetFacing = facing || cameraFacing;
    
    try {
      setCameraStatus('requesting');
      info('正在启动摄像头...');
      console.log('startCamera 使用的摄像头方向:', targetFacing);
      
      // 检查浏览器支持
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('浏览器不支持摄像头功能');
      }
      
      // 检查HTTPS环境
      const isSecure = location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1';
      if (!isSecure) {
        throw new Error('摄像头功能需要HTTPS环境或本地环境');
      }
      
      // 检查权限状态
      const permissionState = await checkCameraPermissions();
      console.log('权限检查结果:', permissionState);
      
      if (permissionState === 'denied') {
        throw new Error('摄像头权限已被拒绝，请在浏览器设置中重新允许摄像头访问');
      }
      
      // 枚举可用设备
      const devices = await enumerateDevices();
      if (devices.length === 0) {
        console.log('未检测到摄像头设备，但继续尝试启动');
      }
      
      // 尝试不同的约束条件（降级策略）
      const constraintOptions = [
        {
          video: {
            facingMode: targetFacing === 'front' ? 'user' : 'environment',
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 }
          },
          audio: false
        },
        {
          video: {
            facingMode: targetFacing === 'front' ? 'user' : 'environment',
            width: { ideal: 640 },
            height: { ideal: 480 }
          },
          audio: false
        },
        {
          video: {
            facingMode: targetFacing === 'front' ? 'user' : 'environment'
          },
          audio: false
        },
        {
          video: true,
          audio: false
        }
      ];
      
      let stream = null;
      let lastError = null;
      
      for (let i = 0; i < constraintOptions.length; i++) {
        try {
          console.log(`尝试约束条件 ${i + 1}:`, constraintOptions[i]);
          stream = await navigator.mediaDevices.getUserMedia(constraintOptions[i]);
          console.log('成功获取媒体流:', stream);
          break;
        } catch (constraintError) {
          console.log(`约束条件 ${i + 1} 失败:`, constraintError);
          lastError = constraintError;
          if (i === constraintOptions.length - 1) {
            throw constraintError;
          }
        }
      }
      
      if (!stream) {
        throw lastError || new Error('无法获取摄像头流');
      }
      
      setCameraStream(stream);
      setCameraStatus('active');
      
      // 监听流状态
      stream.getTracks().forEach(track => {
        track.addEventListener('ended', () => {
          console.log('摄像头轨道已结束');
          setCameraStatus('error');
          warning('摄像头连接已断开');
        });
      });
      
      if (videoRef.current) {
        // 清理之前的事件监听器
        if ((videoRef.current as any)._cleanup) {
          (videoRef.current as any)._cleanup();
        }
        
        // 强制设置video元素属性
        const video = videoRef.current;
        video.muted = true;
        video.playsInline = true;
        video.autoplay = true;
        
        // 创建令牌防止过期的播放请求
        const token = Symbol('playToken');
        (video as any).__playToken = token;
        
        // 设置流对象
        video.srcObject = stream;
        
        // 添加视频事件监听
        const handleLoadedMetadata = () => {
          console.log('视频元数据已加载:', {
            width: video.videoWidth,
            height: video.videoHeight,
            duration: video.duration
          });
        };
        
        const handleCanPlay = () => {
          console.log('视频可以播放');
        };
        
        const handlePlaying = () => {
          console.log('视频开始播放');
          success('摄像头已启动，点击拍照按钮进行拍照');
        };
        
        const handleError = (e: any) => {
          console.error('视频播放错误:', e);
          warning('视频播放失败');
        };
        
        video.addEventListener('loadedmetadata', handleLoadedMetadata);
        video.addEventListener('canplay', handleCanPlay);
        video.addEventListener('playing', handlePlaying);
        video.addEventListener('error', handleError);
        
        // 安全播放函数
        const playSafe = async () => {
          // 检查令牌，避免过期请求
          if ((video as any).__playToken !== token) return;
          
          // 等待元数据加载
          if (video.readyState < 1) {
            await new Promise<void>((resolve, reject) => {
              const timeout = setTimeout(() => {
                reject(new Error('视频元数据加载超时'));
              }, 10000);
              
              const onLoadedMetadata = () => {
                clearTimeout(timeout);
                video.removeEventListener('loadedmetadata', onLoadedMetadata);
                console.log('视频元数据加载完成，尺寸:', video.videoWidth, 'x', video.videoHeight);
                resolve();
              };
              
              if (video.readyState >= 1) {
                // 元数据已经加载
                clearTimeout(timeout);
                resolve();
              } else {
                video.addEventListener('loadedmetadata', onLoadedMetadata);
              }
            });
          }
          
          // 再次检查令牌
          if ((video as any).__playToken !== token) return;
          
          try {
            // 强制播放
            await video.play();
            
            // 验证播放状态
            if (video.paused) {
              console.warn('视频仍处于暂停状态，尝试再次播放');
              await video.play();
            }
            
          } catch (playError: any) {
            // 忽略AbortError和中断错误
            const msg = String(playError?.message || '');
            if (playError?.name === 'AbortError' || msg.includes('interrupted') || msg.includes('AbortError')) {
              console.log('播放被中断（正常现象）:', msg);
              return;
            }
            
            console.error('视频播放失败:', playError);
            
            // 尝试用户交互后播放
            const playOnInteraction = () => {
              if ((video as any).__playToken !== token) return;
              video.play().then(() => {
                console.log('用户交互后播放成功');
                document.removeEventListener('click', playOnInteraction);
                document.removeEventListener('touchstart', playOnInteraction);
              }).catch(e => {
                const userMsg = String(e?.message || '');
                if (e?.name === 'AbortError' || userMsg.includes('interrupted')) {
                  return; // 忽略用户交互时的中断错误
                }
                console.error('用户交互后播放仍然失败:', e);
              });
            };
            
            document.addEventListener('click', playOnInteraction, { once: true });
            document.addEventListener('touchstart', playOnInteraction, { once: true });
            
            warning('摄像头启动成功但需要用户交互才能播放，请点击屏幕');
          }
        };

        // 使用 requestAnimationFrame 确保 srcObject 更新已应用
        requestAnimationFrame(() => { playSafe(); });
        
        // 清理事件监听器
        const cleanup = () => {
          video.removeEventListener('loadedmetadata', handleLoadedMetadata);
          video.removeEventListener('canplay', handleCanPlay);
          video.removeEventListener('playing', handlePlaying);
          video.removeEventListener('error', handleError);
        };
        
        // 保存清理函数以便后续使用
        (video as any)._cleanup = cleanup;
      }
      
    } catch (error: any) {
      console.error('启动摄像头失败:', error);
      setCameraStatus('error');
      
      let errorMessage = '无法启动摄像头';
      let troubleshootingTips = [];
      
      if (error.name === 'NotAllowedError') {
        errorMessage = '摄像头权限被拒绝';
        troubleshootingTips = [
          '点击浏览器地址栏左侧的锁图标',
          '选择"摄像头"权限并设置为"允许"',
          '刷新页面重新尝试',
          '如果仍然失败，请检查浏览器设置中的摄像头权限'
        ];
      } else if (error.name === 'NotFoundError') {
        errorMessage = '未找到摄像头设备';
        troubleshootingTips = [
          '确保摄像头已正确连接',
          '检查设备管理器中的摄像头状态',
          '尝试重新连接摄像头设备',
          '重启浏览器或计算机'
        ];
      } else if (error.name === 'NotReadableError') {
        errorMessage = '摄像头被其他应用占用';
        troubleshootingTips = [
          '关闭其他正在使用摄像头的应用',
          '检查视频会议软件（如Zoom、Teams等）',
          '重启浏览器',
          '重新连接摄像头设备'
        ];
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = '摄像头不支持所需的分辨率';
        troubleshootingTips = [
          '摄像头硬件限制',
          '尝试使用基础模式',
          '更新摄像头驱动程序'
        ];
      } else if (error.message.includes('HTTPS')) {
        errorMessage = '需要HTTPS环境';
        troubleshootingTips = [
          '使用 https:// 访问网站',
          '或在本地环境（localhost）中使用',
          '联系网站管理员启用HTTPS'
        ];
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // 显示详细错误信息
      warning(errorMessage);
      
      // 在控制台输出故障排除提示
      if (troubleshootingTips.length > 0) {
        console.log('故障排除提示:');
        troubleshootingTips.forEach((tip, index) => {
          console.log(`${index + 1}. ${tip}`);
        });
      }
      
      // 自动重试机制（有限次数）
      if (retryCount < maxRetries && (error.name === 'NotReadableError' || error.name === 'OverconstrainedError')) {
        console.log(`自动重试 ${retryCount + 1}/${maxRetries}`);
        setTimeout(() => {
          startCamera(retryCount + 1);
        }, 2000);
      }
    }
  };
  
  // 使用更低约束条件的备用方法
  const startCameraWithLowerConstraints = async () => {
    try {
      setCameraStatus('requesting');
      info('正在使用基础设置启动摄像头...');
      
      const basicConstraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 }
        },
        audio: false
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      setCameraStream(stream);
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setCameraStatus('active');
        success('摄像头已启动（基础模式）');
      }
    } catch (error) {
      console.error('基础模式启动也失败:', error);
      setCameraStatus('error');
      warning('摄像头启动失败，请检查设备和权限');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current || cameraStatus !== 'active') {
      warning('摄像头未准备就绪');
      return;
    }
    
    try {
      setCameraStatus('capturing');
      localStorage.setItem('camera_capturing', 'true');
      
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) {
        warning('无法获取画布上下文');
        setCameraStatus('active');
        localStorage.removeItem('camera_capturing');
        return;
      }
      
      // 等待视频元素完全加载
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        warning('视频尚未完全加载，请稍后再试');
        setCameraStatus('active');
        localStorage.removeItem('camera_capturing');
        return;
      }
      
      // 设置画布尺寸与视频尺寸一致
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      // 根据镜像设置处理图像绘制
      if (isMirrorEnabled) {
        context.save(); // 保存当前状态
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore(); // 恢复到保存的状态
      } else {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
      }
      
      // 转换为图片数据
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      setCapturedPhoto(photoDataUrl);
      setShowPhotoPreview(true);
      setCameraStatus('preview');
      localStorage.removeItem('camera_capturing');
      
      // 播放拍照音效（可选）
      playShutterSound();
      
      success('拍照成功！');
    } catch (error) {
      console.error('拍照失败:', error);
      warning('拍照失败，请重试');
      setCameraStatus('active');
      localStorage.removeItem('camera_capturing');
    }
  };

  const playShutterSound = () => {
    // 创建简单的拍照音效
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.1);
    } catch (error) {
      // 音效播放失败不影响拍照功能
      console.log('无法播放拍照音效');
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => {
        track.stop();
        console.log('停止摄像头轨道:', track.kind, track.label);
      });
      setCameraStream(null);
    }
    setCameraStatus('idle');
    if (videoRef.current) {
      // 清理事件监听器
      if ((videoRef.current as any)._cleanup) {
        (videoRef.current as any)._cleanup();
      }
      videoRef.current.srcObject = null;
    }
  };
  
  // 手动重试摄像头启动
  const retryCamera = async () => {
    info('重新启动摄像头...');
    stopCamera();
    setTimeout(() => {
      startCamera();
    }, 500);
  };

  // 监控摄像头流状态和video元素状态
  useEffect(() => {
    if (cameraStream && cameraStatus === 'active') {
      const videoTracks = cameraStream.getVideoTracks();
      if (videoTracks.length > 0) {
        const track = videoTracks[0];
        
        const handleTrackEnded = () => {
          console.log('摄像头轨道已结束');
          setCameraStatus('error');
          warning('摄像头连接已断开');
        };
        
        track.addEventListener('ended', handleTrackEnded);
        
        // 定期检查轨道状态和video元素状态
        const statusCheckInterval = setInterval(() => {
          if (track.readyState === 'ended') {
            console.log('检测到摄像头轨道已结束');
            setCameraStatus('error');
            clearInterval(statusCheckInterval);
            return;
          }
          
          // 检查video元素状态
          if (videoRef.current) {
            const video = videoRef.current;
            
            // 如果video元素暂停且有流，尝试重新播放
            if (video.paused && video.srcObject && track.readyState === 'live') {
              console.log('检测到video元素暂停，尝试重新播放');
              video.play().catch(e => {
                console.error('自动重新播放失败:', e);
              });
            }
            
            // 如果video元素没有源对象但流存在，重新设置
            if (!video.srcObject && cameraStream) {
              console.log('检测到video元素丢失源对象，重新设置');
              video.srcObject = cameraStream;
              video.play().catch(e => {
                console.error('重新设置源对象后播放失败:', e);
              });
            }
            
            // 检查video尺寸
            if (video.videoWidth === 0 || video.videoHeight === 0) {
              console.log('检测到video尺寸为0，可能存在问题');
            }
          }
        }, 2000); // 每2秒检查一次
        
        return () => {
          track.removeEventListener('ended', handleTrackEnded);
          clearInterval(statusCheckInterval);
        };
      }
    }
  }, [cameraStream, cameraStatus]);
  
  // 组件卸载时清理资源
  useEffect(() => {
    return () => {
      // 清理摄像头资源
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
      // 清理录制定时器
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      // 清理视频URL
      if (recordedVideo && recordedVideo.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideo);
      }
      // 清理localStorage状态
      localStorage.removeItem('camera_recording');
      localStorage.removeItem('camera_capturing');
    };
  }, [cameraStream, recordedVideo]);

  const retakePhoto = () => {
    setShowPhotoPreview(false);
    setCapturedPhoto(null);
    setCameraStatus('active');
  };

  const savePhoto = () => {
    if (capturedPhoto) {
      // 进入照片编辑步骤
      setCurrentStep('photo_editor');
      success('照片已保存，进入编辑模式');
    }
  };

  const handlePhotoPublish = async (publishData: any) => {
    console.log('发布照片:', publishData);
    
    try {
      // 添加用户ID和照片信息
      const enrichedPublishData = {
        ...publishData,
        userId: 'user_demo_001', // 统一使用user_demo_001作为演示用户ID
        imageUrl: capturedPhoto, // 保存照片URL引用
        createdAt: new Date().toISOString()
      };
      
      // 发布到推荐系统（作为视频处理）
      const photoId = await recommendationService.publishVideo(enrichedPublishData);
      console.log('照片已发布到推荐系统，ID:', photoId);
      
      // 重置状态
      setCurrentStep('camera');
      setCapturedPhoto(null);
      setShowPhotoPreview(false);
      setCameraStatus('idle');
      
      // 成功提示并导航到个人作品页面
      success('照片发布成功！正在跳转到个人作品页面...');
      
      // 延迟导航，让用户看到成功提示
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
      
    } catch (error) {
      console.error('发布照片失败:', error);
      warning('照片发布失败，请重试');
    }
  };

  const handlePhotoEditorCancel = () => {
    // 清理localStorage状态
    localStorage.removeItem('camera_recording');
    localStorage.removeItem('camera_capturing');
    setCurrentStep('camera');
    setShowPhotoPreview(true);
    setCameraStatus('preview');
  };

  const handleLocalUpload = () => {
    // 根据模式提示用户可以选择的文件类型
    if (mode === 'photo') {
      info('请选择图片文件');
    } else if (mode === 'video') {
      info('请选择视频文件');
    }
    
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (mode === 'video') {
      if (file.type.startsWith('video/')) {
        setUploadedVideo(file);
        // 创建本地视频URL用于预览
        const videoUrl = URL.createObjectURL(file);
        setRecordedVideo(videoUrl);
        setCurrentStep('editor');
        // 设置编辑状态
        localStorage.setItem('camera_editing', 'true');
        success('视频文件已选择，进入编辑器');
      } else {
        warning('请选择有效的视频文件');
      }
    } else if (mode === 'photo') {
      if (file.type.startsWith('image/')) {
        // 设置照片并进入编辑步骤
        const imageUrl = URL.createObjectURL(file);
        setCapturedPhoto(imageUrl);
        setCurrentStep('photo_editor');
        success('图片文件已选择，进入编辑模式');
      } else {
        warning('请选择有效的图片文件');
      }
    }
    
    // 清空文件输入框，允许重复选择同一文件
    event.target.value = '';
  };



  useEffect(() => {
    return () => {
      if (recordingInterval.current) {
        clearInterval(recordingInterval.current);
      }
      
      // 停止MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current = null;
      }
      
      // 清理录制的视频URL
      if (recordedVideo && recordedVideo.startsWith('blob:')) {
        URL.revokeObjectURL(recordedVideo);
      }
      
      // 组件卸载时停止摄像头
      stopCamera();
    };
  }, [recordedVideo]);

  // 监听模式切换，清理照片预览状态并处理视频模式
  useEffect(() => {
    if (mode !== 'photo') {
      setShowPhotoPreview(false);
      setCapturedPhoto(null);
    }
    
    // 视频模式下自动启动摄像头预览
    if (mode === 'video' && (cameraStatus === 'idle' || cameraStatus === 'error')) {
      handleVideoModeStart();
    }
  }, [mode, cameraStatus]);

  // 移除自动调整镜像状态的useEffect，改为在摄像头切换函数中显式设置

  const toggleFlash = () => {
    setFlashEnabled(!flashEnabled);
  };

  const toggleMirror = () => {
    const newMirrorState = !isMirrorEnabled;
    setIsMirrorEnabled(newMirrorState);
    if (newMirrorState) {
      success('镜像已开启');
    } else {
      info('镜像已关闭');
    }
  };

  // 直接切换到前置摄像头
  const switchToFront = async () => {
    console.log('switchToFront 开始执行，当前状态:', { cameraFacing, isMirrorEnabled, cameraStatus });
    
    if (cameraStatus === 'requesting' || cameraStatus === 'capturing' || isSwitchingCamera) {
      warning('请等待当前操作完成');
      return;
    }
    
    if (cameraFacing === 'front') {
      info('已经是前置摄像头');
      return;
    }
    
    setIsSwitchingCamera(true);
    const facingText = '前置摄像头';
    
    try {
      console.log('摄像头切换:', {
        from: cameraFacing,
        to: 'front'
      });
      
      const mirrorText = '镜像已开启';
      
      // 如果摄像头正在运行，重新启动以应用新的朝向
      if (cameraStatus === 'active' || cameraStatus === 'preview') {
        info(`正在切换到${facingText}...`);
        stopCamera();
        // 短暂延迟后重新启动摄像头，确保状态更新完成
        setTimeout(async () => {
          try {
            // 在重新启动摄像头之前设置状态
            console.log('设置前置摄像头状态: facing=front, mirror=true');
            setCameraFacing('front');
            // 前置摄像头默认开启镜像
            setIsMirrorEnabled(true);
            await startCamera(0, 'front');
            console.log('前置摄像头切换完成，最终状态:', { cameraFacing: 'front', isMirrorEnabled: true });
            success(`已切换到${facingText}，${mirrorText}`);
          } catch (error) {
            console.error('切换到前置摄像头失败:', error);
            warning(`切换到${facingText}失败`);
          } finally {
            setIsSwitchingCamera(false);
          }
        }, 300);
      } else {
        // 非运行状态下直接设置状态
        console.log('设置前置摄像头状态: facing=front, mirror=true');
        setCameraFacing('front');
        setIsMirrorEnabled(true);
        console.log('前置摄像头设置完成，最终状态:', { cameraFacing: 'front', isMirrorEnabled: true });
        success(`已设置为${facingText}，${mirrorText}`);
        setIsSwitchingCamera(false);
      }
    } catch (error) {
      console.error('摄像头切换失败:', error);
      warning('摄像头切换失败');
      setIsSwitchingCamera(false);
    }
  };

  // 直接切换到后置摄像头
  const switchToBack = async () => {
    console.log('switchToBack 开始执行，当前状态:', { cameraFacing, isMirrorEnabled, cameraStatus });
    
    if (cameraStatus === 'requesting' || cameraStatus === 'capturing' || isSwitchingCamera) {
      warning('请等待当前操作完成');
      return;
    }
    
    if (cameraFacing === 'back') {
      info('已经是后置摄像头');
      return;
    }
    
    setIsSwitchingCamera(true);
    const facingText = '后置摄像头';
    
    try {
      console.log('摄像头切换:', {
        from: cameraFacing,
        to: 'back'
      });
      
      const mirrorText = '镜像已关闭';
      
      // 如果摄像头正在运行，重新启动以应用新的朝向
      if (cameraStatus === 'active' || cameraStatus === 'preview') {
        info(`正在切换到${facingText}...`);
        stopCamera();
        // 短暂延迟后重新启动摄像头，确保状态更新完成
        setTimeout(async () => {
          try {
            // 在重新启动摄像头之前设置状态
            console.log('设置后置摄像头状态: facing=back, mirror=false');
            setCameraFacing('back');
            // 后置摄像头默认关闭镜像
            setIsMirrorEnabled(false);
            await startCamera(0, 'back');
            console.log('后置摄像头切换完成，最终状态:', { cameraFacing: 'back', isMirrorEnabled: false });
            // 强制DOM更新，确保后置摄像头不被镜像
            if (videoRef.current) {
              videoRef.current.style.transform = 'none';
              console.log('强制设置后置摄像头transform为none');
            }
            success(`已切换到${facingText}，${mirrorText}`);
          } catch (error) {
            console.error('切换到后置摄像头失败:', error);
            warning(`切换到${facingText}失败`);
          } finally {
            setIsSwitchingCamera(false);
          }
        }, 300);
      } else {
        // 非运行状态下直接设置状态
        console.log('设置后置摄像头状态: facing=back, mirror=false');
        setCameraFacing('back');
        setIsMirrorEnabled(false);
        console.log('后置摄像头设置完成，最终状态:', { cameraFacing: 'back', isMirrorEnabled: false });
        // 强制DOM更新，确保后置摄像头不被镜像
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.style.transform = 'none';
            console.log('强制设置后置摄像头transform为none');
          }
        }, 100);
        success(`已设置为${facingText}，${mirrorText}`);
        setIsSwitchingCamera(false);
      }
    } catch (error) {
      console.error('摄像头切换失败:', error);
      warning('摄像头切换失败');
      setIsSwitchingCamera(false);
    }
  };



  // 渲染高级视频编辑器
  if (currentStep === 'editor') {
    return (
      <AdvancedVideoEditor
        videoSrc={recordedVideo || undefined}
        onSave={(editedVideo) => {
          console.log('保存编辑后的视频:', editedVideo);
          handleEditorSave(editedVideo);
          // 这里可以添加保存到发布流程的逻辑
        }}
        onCancel={handleEditorCancel}
      />
    );
  }

  // 渲染照片编辑器
  if (currentStep === 'photo_editor') {
    return (
      <PhotoEditor
        imageUrl={capturedPhoto || ''}
        onPublish={handlePhotoPublish}
        onCancel={handlePhotoEditorCancel}
      />
    );
  }

  // 渲染发布页面
  if (currentStep === 'publish') {
    // 确保videoData包含必要的视频信息
    const videoDataForPublish = {
      ...editedVideo,
      videoUrl: editedVideo?.videoUrl || recordedVideo, // 优先使用编辑后的视频URL
      originalVideoUrl: recordedVideo,
      duration: recordingTime
    };
    
    return (
      <VideoPublish
        videoData={videoDataForPublish}
        onPublish={handlePublish}
        onCancel={handlePublishCancel}
      />
    );
  }

  // 渲染拍摄页面
  return (
    <div className="relative min-h-screen bg-black overflow-hidden">
      {/* 相机预览区域 */}
      <div className="absolute inset-0 bg-black flex items-center justify-center">
        {(cameraStatus === 'requesting' || cameraStatus === 'active' || cameraStatus === 'capturing' || cameraStatus === 'preview') && !showPhotoPreview ? (
          <div className="relative w-full h-full">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              controls={false}
              className="w-full h-full object-cover bg-black"
              style={(() => {
                // 前置摄像头根据镜像设置决定，后置摄像头显示原始画面不翻转
                const shouldMirror = cameraFacing === 'front' && isMirrorEnabled;
                const transform = cameraFacing === 'back' ? 'none' : (shouldMirror ? 'scaleX(-1)' : 'none');
                console.log('Video transform 状态检查:', {
                  cameraFacing,
                  isMirrorEnabled,
                  shouldMirror,
                  finalTransform: transform
                });
                return {
                  transform: transform,
                  backgroundColor: '#000000',
                  minHeight: '100%',
                  minWidth: '100%'
                };
              })()}
              onLoadedMetadata={() => {
                console.log('视频元数据已加载');
                console.log('当前摄像头状态:', {
                  cameraFacing,
                  isMirrorEnabled,
                  shouldMirror: cameraFacing === 'front' && isMirrorEnabled
                });
                if (videoRef.current) {
                  console.log('视频尺寸:', videoRef.current.videoWidth, 'x', videoRef.current.videoHeight);
                  console.log('视频就绪状态:', videoRef.current.readyState);
                  console.log('视频源:', videoRef.current.srcObject);
                  
                  // 强制刷新video元素
                  if (videoRef.current.srcObject && videoRef.current.paused) {
                    videoRef.current.play().catch(e => {
                      console.error('强制播放失败:', e);
                    });
                  }
                }
              }}
              onCanPlay={() => {
                console.log('视频可以播放');
                if (videoRef.current && videoRef.current.paused) {
                  videoRef.current.play().catch(e => {
                    console.error('自动播放失败:', e);
                  });
                }
              }}
              onPlaying={() => {
                console.log('视频正在播放');
                console.log('当前时间:', videoRef.current?.currentTime);
              }}
              onError={(e) => {
                console.error('视频播放错误:', e);
                console.error('错误详情:', e.currentTarget.error);
                warning('视频播放失败');
              }}
              onLoadStart={() => {
                console.log('开始加载视频');
              }}
              onSuspend={() => {
                console.log('视频加载暂停');
              }}
              onWaiting={() => {
                console.log('视频等待数据');
              }}
              onStalled={() => {
                console.log('视频加载停滞');
              }}
            />
            

            

            

            

          </div>
        ) : showPhotoPreview && capturedPhoto ? (
          <div className="relative w-full h-full flex items-center justify-center bg-black">
            <img
              src={capturedPhoto}
              alt="拍摄的照片"
              className="max-w-full max-h-full object-contain"
              onLoad={() => {
                console.log('预览图片已加载');
                success('照片预览已准备就绪');
              }}
              onError={(e) => {
                console.error('预览图片加载失败:', e);
                warning('照片预览失败');
              }}
            />
            {/* 照片预览操作按钮 */}
            <div className="absolute bottom-24 left-0 right-0 z-20 flex justify-center space-x-4">
              <button
                onClick={retakePhoto}
                className="px-6 py-3 bg-white/20 backdrop-blur-sm rounded-lg text-white font-medium hover:bg-white/30 transition-colors flex items-center space-x-2"
              >
                <RotateCcw className="w-4 h-4" />
                <span>重拍</span>
              </button>
              <button
                onClick={savePhoto}
                className="px-6 py-3 bg-blue-500 rounded-lg text-white font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
              >
                <Image className="w-4 h-4" />
                <span>保存并编辑</span>
              </button>
            </div>
            {/* 预览状态指示器 */}
            <div className="absolute top-6 left-0 right-0 flex justify-center">
              <div className="bg-black/50 backdrop-blur-sm rounded-lg px-4 py-2">
                <span className="text-white text-sm font-medium">照片预览</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-white text-center">
            <CameraIcon className="w-24 h-24 mx-auto mb-4 opacity-50" />
            {cameraStatus === 'requesting' ? (
              <>
                <p className="text-lg opacity-75">正在启动摄像头...</p>
                <div className="mt-4 flex justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                </div>
              </>
            ) : cameraStatus === 'error' ? (
              <>
                <p className="text-lg opacity-75 text-red-400">摄像头启动失败</p>
                <p className="text-sm opacity-50 mt-2">请检查摄像头权限设置</p>
                
                {/* 重试按钮 */}
                <button
                  onClick={retryCamera}
                  className="mt-4 px-6 py-3 bg-blue-500 hover:bg-blue-600 rounded-lg text-white font-medium transition-colors flex items-center space-x-2 mx-auto"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>重试启动摄像头</span>
                </button>
                
                {/* 故障排除提示 */}
                <div className="mt-6 bg-black/30 backdrop-blur-sm rounded-lg p-4 max-w-md mx-auto">
                  <h3 className="text-white font-medium mb-3 flex items-center">
                    <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></span>
                    故障排除提示：
                  </h3>
                  <ul className="text-white text-sm space-y-2 opacity-90">
                    <li>• 确保浏览器已允许摄像头权限</li>
                    <li>• 检查摄像头是否被其他应用占用</li>
                    <li>• 尝试刷新页面重新授权</li>
                    <li>• 确保使用HTTPS或本地环境</li>
                  </ul>
                </div>
              </>
            ) : mode === 'photo' ? (
              <>
                <p className="text-lg opacity-75">点击拍照按钮启动摄像头</p>
                <p className="text-sm opacity-50 mt-2">首次使用需要授权摄像头权限</p>
              </>
            ) : mode === 'video' ? (
              <>
                <p className="text-lg opacity-75">点击录制按钮启动摄像头并开始录制</p>
                <p className="text-sm opacity-50 mt-2">首次使用需要授权摄像头权限</p>
              </>
            ) : (
              <>
                <p className="text-lg opacity-75">相机预览区域</p>
                <p className="text-sm opacity-50 mt-2">选择拍照或录制模式开始使用</p>
              </>
            )}
          </div>
        )}
        
        {/* 隐藏的Canvas用于拍照 */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>

      {/* 顶部工具栏 */}
      <div className="absolute top-0 left-0 right-0 z-10 p-2 max-sm:p-3 sm:p-4 pt-safe-top max-sm:pt-8 sm:pt-12">
        <div className="flex justify-between items-center">
          {/* 模式切换 */}
          <div className="flex bg-black/30 backdrop-blur-sm rounded-full p-0.5 max-sm:p-1 sm:p-1">
            <button
              onClick={() => setMode('video')}
              className={`px-1.5 max-sm:px-2 sm:px-3 py-1 max-sm:py-1.5 sm:py-2 rounded-full text-xs max-sm:text-xs font-medium transition-colors ${
                mode === 'video'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-gray-300'
              }`}
            >
              <Video className="w-3 h-3 max-sm:w-3 max-sm:h-3 inline mr-0.5 max-sm:mr-0.5 sm:mr-1" />
              <span className="hidden max-sm:hidden sm:inline">视频</span>
            </button>
            <button
              onClick={() => setMode('photo')}
              className={`px-1.5 max-sm:px-2 sm:px-3 py-1 max-sm:py-1.5 sm:py-2 rounded-full text-xs max-sm:text-xs font-medium transition-colors ${
                mode === 'photo'
                  ? 'bg-white text-black'
                  : 'text-white hover:text-gray-300'
              }`}
            >
              <Image className="w-3 h-3 max-sm:w-3 max-sm:h-3 inline mr-0.5 max-sm:mr-0.5 sm:mr-1" />
              <span className="hidden max-sm:hidden sm:inline">照片</span>
            </button>

          </div>
          <div className="flex gap-1 max-sm:gap-1 sm:gap-2">
            <button
              onClick={toggleFlash}
              className={`p-1.5 max-sm:p-2 sm:p-3 rounded-full ${
                flashEnabled ? 'bg-yellow-500' : 'bg-black/30'
              } backdrop-blur-sm transition-colors`}
              title={flashEnabled ? '关闭闪光灯' : '开启闪光灯'}
            >
              {flashEnabled ? (
                <Zap className="w-4 h-4 max-sm:w-5 max-sm:h-5 sm:w-6 sm:h-6 text-white" />
              ) : (
                <ZapOff className="w-4 h-4 max-sm:w-5 max-sm:h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </button>
            <button
              onClick={toggleMirror}
              className={`p-1.5 max-sm:p-2 sm:p-3 rounded-full ${
                isMirrorEnabled ? 'bg-blue-500' : 'bg-black/30'
              } backdrop-blur-sm transition-colors`}
              title={isMirrorEnabled ? '关闭镜像' : '开启镜像'}
            >
              <FlipHorizontal className="w-4 h-4 max-sm:w-5 max-sm:h-5 sm:w-6 sm:h-6 text-white" />
            </button>

          </div>

          <div className="text-white text-center">
            {isRecording && mode === 'video' && (
              <div className="flex items-center space-x-1 max-sm:space-x-1 sm:space-x-2">
                <div className="w-2 h-2 max-sm:w-2 max-sm:h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="text-xs max-sm:text-xs sm:text-sm font-mono">
                  {Math.floor(recordingTime / 60).toString().padStart(2, '0')}:
                  {(recordingTime % 60).toString().padStart(2, '0')}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 底部控制栏 */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-3 max-sm:p-4 sm:p-6 pb-safe-bottom max-sm:pb-20 sm:pb-32">
        <div className="flex items-center justify-center space-x-3 max-sm:space-x-4 sm:space-x-6">
          {/* 特效按钮 */}
          <button 
            onClick={handleEffectsClick}
            className="w-9 h-9 max-sm:w-10 max-sm:h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            title="拍摄特效"
          >
            <Sparkles className="w-4 h-4 max-sm:w-5 max-sm:h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* 本地上传按钮 */}
          <button 
            onClick={handleLocalUpload}
            className="w-9 h-9 max-sm:w-10 max-sm:h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
            title="上传本地文件"
          >
            <Upload className="w-4 h-4 max-sm:w-5 max-sm:h-5 sm:w-6 sm:h-6 text-white" />
          </button>

          {/* 拍摄/直播按钮 */}
          <button
            onClick={
              mode === 'video' ? handleRecord : handlePhotoCapture
            }
            className={`relative w-14 h-14 max-sm:w-16 max-sm:h-16 sm:w-20 sm:h-20 rounded-full border-3 max-sm:border-3 sm:border-4 border-white flex items-center justify-center transition-all duration-200 ${
              isRecording ? 'bg-red-500 scale-110' : 'bg-transparent hover:scale-105'
            }`}
          >
            {mode === 'video' ? (
              isRecording ? (
                <Square className="w-6 h-6 sm:w-8 sm:h-8 text-white fill-current" />
              ) : (
                <Circle className="w-12 h-12 sm:w-16 sm:h-16 text-red-500 fill-current" />
              )
            ) : (
              <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center transition-colors ${
                cameraStatus === 'active' ? 'bg-blue-500' : 
                cameraStatus === 'requesting' ? 'bg-yellow-500' :
                cameraStatus === 'capturing' ? 'bg-green-500' :
                cameraStatus === 'preview' ? 'bg-purple-500' :
                cameraStatus === 'error' ? 'bg-red-500' :
                'bg-white'
              }`}>
                <CameraIcon className={`w-6 h-6 sm:w-8 sm:h-8 ${
                  cameraStatus === 'idle' ? 'text-black' : 'text-white'
                }`} />
              </div>
            )}
          </button>

          {/* 镜头切换按钮 */}
          <button
            onClick={() => {
              console.log('切换按钮点击，当前状态:', { cameraFacing, isMirrorEnabled });
              if (cameraFacing === 'front') {
                console.log('从前置切换到后置');
                switchToBack();
              } else {
                console.log('从后置切换到前置');
                switchToFront();
              }
            }}
            disabled={isSwitchingCamera || cameraStatus === 'requesting' || cameraStatus === 'capturing'}
            className="w-9 h-9 max-sm:w-10 max-sm:h-10 sm:w-12 sm:h-12 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors disabled:opacity-50"
            title="切换摄像头"
          >
            {isSwitchingCamera ? (
              <div className="w-3 h-3 max-sm:w-4 max-sm:h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <FlipHorizontal className="w-3 h-3 max-sm:w-4 max-sm:h-4 sm:w-5 sm:h-5 text-white" />
            )}
          </button>

        </div>

        {/* 隐藏的文件输入 */}
        <input
          ref={fileInputRef}
          type="file"
          accept={mode === 'video' ? 'video/*' : mode === 'photo' ? 'image/*' : ''}
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* 录制时长指示器 - 仅在视频模式显示 */}
        {mode === 'video' && (
          <div className="mt-3 max-sm:mt-4 text-center">
            <div className="inline-flex items-center space-x-1.5 max-sm:space-x-2 text-white text-xs max-sm:text-sm">
              <span>15s</span>
              <div className="w-24 max-sm:w-32 h-1 bg-white/30 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-red-500 transition-all duration-300"
                  style={{ width: `${(recordingTime / 60) * 100}%` }}
                ></div>
              </div>
              <span>60s</span>
            </div>
            <p className="text-white text-xs max-sm:text-xs opacity-75 mt-1.5 max-sm:mt-2 px-2">
              {cameraStatus === 'active' ? '摄像头已就绪，点击录制按钮开始拍摄' : 
               cameraStatus === 'requesting' ? '正在启动摄像头...' :
               cameraStatus === 'error' ? '摄像头启动失败，点击上传按钮选择本地视频' :
               '点击录制按钮启动摄像头并开始拍摄，或点击上传按钮选择本地视频'}
            </p>
          </div>
        )}
        
        {/* 视频模式提示 */}
        {mode === 'video' && cameraStatus !== 'idle' && (
          <div className="mt-4 text-center">
            {cameraStatus === 'requesting' && (
              <p className="text-yellow-400 text-sm opacity-75">正在启动摄像头，请稍候...</p>
            )}
            {cameraStatus === 'active' && !isRecording && (
              <div className="text-center">

              </div>
            )}
            {cameraStatus === 'active' && isRecording && (
              <div className="text-center">
                <p className="text-red-400 text-sm opacity-75 mb-2">正在录制中... 点击停止按钮结束录制</p>
                <p className="text-white text-xs opacity-60">
                  录制时长：{Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')} / 1:00
                </p>
              </div>
            )}
            {cameraStatus === 'error' && (
              <div className="text-center">
                <p className="text-red-400 text-sm opacity-75 mb-3">摄像头启动失败，请检查权限设置或点击上传按钮选择本地视频</p>
                <button
                  onClick={retryCamera}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors flex items-center space-x-1 mx-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重试</span>
                </button>
              </div>
            )}
          </div>
        )}
        
        {/* 照片模式提示 */}
        {mode === 'photo' && (
          <div className="mt-4 text-center">
            {cameraStatus === 'idle' && (
              <div>
                <p className="text-white text-sm opacity-75">点击拍照按钮启动摄像头或点击上传按钮选择本地图片</p>
                <p className="text-white text-xs opacity-60 mt-1">
                  当前：{cameraFacing === 'front' ? '前置' : '后置'}摄像头 | 镜像：{isMirrorEnabled ? '开启' : '关闭'}
                </p>
              </div>
            )}
            {cameraStatus === 'requesting' && (
              <p className="text-yellow-400 text-sm opacity-75">正在启动摄像头，请稍候...</p>
            )}
            {cameraStatus === 'active' && !showPhotoPreview && (
              <div className="text-center">
                <p className="text-blue-400 text-sm opacity-75 mb-2">摄像头已就绪，点击拍照按钮进行拍照</p>

              </div>
            )}
            {cameraStatus === 'capturing' && (
              <p className="text-green-400 text-sm opacity-75">正在拍照...</p>
            )}
            {cameraStatus === 'preview' && (
              <div className="text-center">
                <p className="text-blue-400 text-sm opacity-75 mb-2">照片已拍摄，查看预览或重新拍照</p>

              </div>
            )}
            {cameraStatus === 'error' && (
              <div className="text-center">
                <p className="text-red-400 text-sm opacity-75 mb-3">摄像头启动失败，请检查权限设置或点击上传按钮选择本地图片</p>
                <button
                  onClick={retryCamera}
                  className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 rounded-lg text-blue-400 text-sm font-medium transition-colors flex items-center space-x-1 mx-auto"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>重试</span>
                </button>
              </div>
            )}

          </div>
        )}

        {/* 特效面板 */}
        {showEffectsPanel && (
          <CameraEffectsPanel
            videoRef={videoRef}
            canvasRef={canvasRef}
            onClose={() => setShowEffectsPanel(false)}
            onEffectApplied={handleEffectApplied}
          />
        )}

      </div>
    </div>
  );
}