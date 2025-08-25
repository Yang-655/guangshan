import { useState, useRef, useCallback, useEffect } from 'react';

interface CameraOptions {
  video?: boolean | MediaTrackConstraints;
  audio?: boolean | MediaTrackConstraints;
}

interface CameraState {
  stream: MediaStream | null;
  isActive: boolean;
  error: string | null;
  devices: MediaDeviceInfo[];
}

export const useCamera = (options: CameraOptions = { video: true, audio: false }) => {
  const [state, setState] = useState<CameraState>({
    stream: null,
    isActive: false,
    error: null,
    devices: []
  });
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // 获取可用设备
  const getDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setState(prev => ({ ...prev, devices: videoDevices }));
      return videoDevices;
    } catch (error) {
      console.error('Failed to get devices:', error);
      setState(prev => ({ ...prev, error: 'Failed to get camera devices' }));
      return [];
    }
  }, []);

  // 启动摄像头
  const startCamera = useCallback(async (deviceId?: string) => {
    try {
      setState(prev => ({ ...prev, error: null }));
      
      const constraints: MediaStreamConstraints = {
        video: deviceId 
          ? { deviceId: { exact: deviceId }, ...options.video as MediaTrackConstraints }
          : options.video,
        audio: options.audio
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      // 停止之前的流
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      setState(prev => ({ 
        ...prev, 
        stream: stream,  // 修复：确保stream类型为MediaStream
        isActive: true 
      }));
      
      return stream;
    } catch (error) {
      console.error('Failed to start camera:', error);
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Failed to start camera',
        isActive: false 
      }));
      throw error;
    }
  }, [options]);

  // 停止摄像头
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      // 修复：添加类型检查确保stream不是never类型
      const stream = streamRef.current;
      if (stream && stream.getTracks) {
        stream.getTracks().forEach(track => track.stop());
      }
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    setState(prev => ({ 
      ...prev, 
      stream: null, 
      isActive: false 
    }));
  }, []);

  // 切换摄像头
  const switchCamera = useCallback(async (deviceId: string) => {
    if (state.isActive) {
      await startCamera(deviceId);
    }
  }, [state.isActive, startCamera]);

  // 拍照
  const takePhoto = useCallback(() => {
    if (!videoRef.current || !state.stream) {
      throw new Error('Camera not active');
    }
    
    const canvas = document.createElement('canvas');
    const video = videoRef.current;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(video, 0, 0);
      return canvas.toDataURL('image/jpeg');
    }
    
    throw new Error('Failed to capture photo');
  }, [state.stream]);

  // 组件卸载时清理
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // 初始化设备列表
  useEffect(() => {
    getDevices();
  }, [getDevices]);

  return {
    ...state,
    videoRef,
    startCamera,
    stopCamera,
    switchCamera,
    takePhoto,
    getDevices
  };
};

export default useCamera;