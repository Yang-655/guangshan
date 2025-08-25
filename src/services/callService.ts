// 修复 simple-peer 的导入方式 - 使用默认导入
import SimplePeer from 'simple-peer';

// 开关：是否输出调试日志
const DEBUG_CALL = (import.meta as any)?.env?.VITE_CALL_DEBUG === 'true';

// 类型定义
type SimplePeerConstructor = new (options?: any) => any;

// 获取 SimplePeer 构造函数的多种尝试方式
const getPeerConstructor = (): SimplePeerConstructor | null => {
  try {
    DEBUG_CALL && console.log('SimplePeer 模块信息:', {
      type: typeof SimplePeer,
      isFunction: typeof SimplePeer === 'function',
      moduleValue: SimplePeer
    });
    
    // simple-peer 使用 CommonJS 导出，在 ES6 中应该直接作为默认导出使用
    if (typeof SimplePeer === 'function') {
      DEBUG_CALL && console.log('使用 SimplePeer 默认导出');
      return SimplePeer as SimplePeerConstructor;
    }
    
    // 如果 SimplePeer 不是函数，可能是包装对象
    if (SimplePeer && typeof SimplePeer === 'object') {
      // 检查是否有 default 属性
      if ((SimplePeer as any).default && typeof (SimplePeer as any).default === 'function') {
        DEBUG_CALL && console.log('使用 SimplePeer.default');
        return (SimplePeer as any).default;
      }
      
      // 遍历所有属性查找构造函数
      const moduleKeys = Object.keys(SimplePeer);
      DEBUG_CALL && console.log('SimplePeer 模块可用的导出:', moduleKeys);
      
      for (const key of moduleKeys) {
        const exportValue = (SimplePeer as any)[key];
        if (typeof exportValue === 'function') {
          DEBUG_CALL && console.log(`使用 SimplePeer.${key}`);
          return exportValue;
        }
      }
    }
    
    console.error('SimplePeer constructor not found. Module info:', {
      type: typeof SimplePeer,
      isFunction: typeof SimplePeer === 'function',
      moduleExists: !!SimplePeer
    });
    return null;
  } catch (error) {
    console.error('Error getting SimplePeer constructor:', error);
    return null;
  }
};

// 初始化 Peer 构造函数
let Peer: SimplePeerConstructor | null = getPeerConstructor();

// 如果初始化失败，提供动态加载的fallback
const loadPeerDynamically = async (): Promise<SimplePeerConstructor> => {
  try {
    let module: any;
    try {
      module = await import('simple-peer');
    } catch (e) {
      DEBUG_CALL && console.warn('Failed to import simple-peer, retrying:', e);
      module = await import('simple-peer');
    }
    
    DEBUG_CALL && console.log('动态加载的模块:', module);
    DEBUG_CALL && console.log('动态加载模块类型:', typeof module);
    DEBUG_CALL && console.log('动态加载模块 default:', module.default);
    DEBUG_CALL && console.log('动态加载模块 default 类型:', typeof module.default);
    
    // simple-peer 使用 CommonJS，在动态导入时会包装在 default 中
    if (module?.default && typeof module.default === 'function') {
      DEBUG_CALL && console.log('使用动态加载的 module.default');
      return module.default;
    }
    if (typeof module === 'function') {
      DEBUG_CALL && console.log('使用动态加载的 module 直接');
      return module;
    }
    throw new Error('Dynamic import failed to find SimplePeer constructor');
  } catch (error) {
    DEBUG_CALL && console.error('Dynamic import of simple-peer failed:', error);
    throw error;
  }
};
import { toast } from 'sonner';

// WebRTC配置
const rtcConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' }
  ],
  sdpSemantics: 'unified-plan'
};

// 创建Peer实例的辅助函数
const createPeer = async (options: any) => {
  try {
    // 检查 WebRTC 支持
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error('WebRTC not supported in this browser');
    }
    
    let PeerConstructor = Peer;
    
    // 如果初始构造函数不可用，尝试动态加载
    if (!PeerConstructor || typeof PeerConstructor !== 'function') {
      DEBUG_CALL && console.log('初始 Peer 构造函数不可用，尝试动态加载...');
      
      try {
        PeerConstructor = await loadPeerDynamically();
        // 更新全局 Peer 引用
        Peer = PeerConstructor;
      } catch (dynamicError) {
        DEBUG_CALL && console.error('动态加载 SimplePeer 失败:', dynamicError);
        
        // 最后尝试重新获取构造函数
        const fallbackPeer = getPeerConstructor();
        if (fallbackPeer && typeof fallbackPeer === 'function') {
          PeerConstructor = fallbackPeer;
          Peer = fallbackPeer;
        } else {
          throw new Error('SimplePeer constructor not available. Please check if simple-peer is properly installed.');
        }
      }
    }
    
    // 合并配置
    const peerOptions = {
      config: rtcConfig,
      ...options
    };
    
    DEBUG_CALL && console.log('创建Peer实例，配置:', peerOptions);
    DEBUG_CALL && console.log('使用的构造函数类型:', typeof PeerConstructor);
    
    return new PeerConstructor(peerOptions);
  } catch (error) {
    console.error('创建Peer实例失败:', error);
    
    // 提供更详细的错误信息
    if (error instanceof Error) {
      if (error.message.includes('SimplePeer')) {
        toast.error('通话功能初始化失败：SimplePeer库未正确加载');
      } else if (error.message.includes('WebRTC')) {
        toast.error('您的浏览器不支持WebRTC通话功能');
      } else {
        toast.error('通话功能初始化失败，请稍后重试');
      }
    }
    
    throw error;
  }
};

export interface CallUser {
  id: string;
  name: string;
  avatar: string;
}

export interface CallState {
  isInCall: boolean;
  isIncoming: boolean;
  isOutgoing: boolean;
  callType: 'voice' | 'video' | null;
  remoteUser: CallUser | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoEnabled: boolean;
  callStartTime: number | null;
}

export type CallEventType = 
  | 'incoming-call'
  | 'call-accepted'
  | 'call-rejected'
  | 'call-ended'
  | 'call-error'
  | 'stream-ready'
  | 'remote-stream-ready';

export interface CallEvent {
  type: CallEventType;
  data?: any;
}

class CallService {
  private peer: any | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callState: CallState = {
    isInCall: false,
    isIncoming: false,
    isOutgoing: false,
    callType: null,
    remoteUser: null,
    localStream: null,
    remoteStream: null,
    isMuted: false,
    isVideoEnabled: true,
    callStartTime: null
  };
  private eventListeners: Map<CallEventType, ((event: CallEvent) => void)[]> = new Map();

  constructor() {
    this.initializeEventListeners();
  }

  private initializeEventListeners() {
    // 初始化事件监听器映射
    const eventTypes: CallEventType[] = [
      'incoming-call',
      'call-accepted',
      'call-rejected',
      'call-ended',
      'call-error',
      'stream-ready',
      'remote-stream-ready'
    ];
    
    eventTypes.forEach(type => {
      this.eventListeners.set(type, []);
    });
  }

  // 事件监听器管理
  public addEventListener(type: CallEventType, listener: (event: CallEvent) => void) {
    const listeners = this.eventListeners.get(type) || [];
    listeners.push(listener);
    this.eventListeners.set(type, listeners);
  }

  public removeEventListener(type: CallEventType, listener: (event: CallEvent) => void) {
    const listeners = this.eventListeners.get(type) || [];
    const index = listeners.indexOf(listener);
    if (index > -1) {
      listeners.splice(index, 1);
    }
  }

  private emit(type: CallEventType, data?: any) {
    const listeners = this.eventListeners.get(type) || [];
    const event: CallEvent = { type, data };
    listeners.forEach(listener => listener(event));
  }

  // 获取用户媒体流
  private async getUserMedia(video: boolean = true): Promise<MediaStream> {
    try {
      const constraints: MediaStreamConstraints = {
        audio: true,
        video: video ? {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 }
        } : false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.localStream = stream;
      this.callState.localStream = stream;
      this.emit('stream-ready', { stream });
      return stream;
    } catch (error) {
      console.error('获取媒体流失败:', error);
      toast.error('无法访问摄像头或麦克风');
      throw error;
    }
  }

  // 发起通话
  public async initiateCall(remoteUser: CallUser, callType: 'voice' | 'video'): Promise<void> {
    try {
      this.callState.isOutgoing = true;
      this.callState.callType = callType;
      this.callState.remoteUser = remoteUser;
      this.callState.callStartTime = Date.now();

      // 获取本地媒体流
      const stream = await this.getUserMedia(callType === 'video');
      this.localStream = stream;
      this.callState.localStream = stream;
      this.emit('stream-ready', { stream });
      
      // 创建 Peer 连接（发起方）
      this.peer = await createPeer({
        initiator: true,
        trickle: false,
        stream: stream
      });

      this.setupPeerEvents();

      toast.success(`正在呼叫 ${remoteUser.name}...`);
      
      // 在实际应用中，这里应该通过信令服务器发送呼叫请求
      // 现在我们模拟一个延迟后的自动接听
      setTimeout(() => {
        this.simulateIncomingCallResponse(true);
      }, 3000);

    } catch (error) {
      console.error('发起通话失败:', error);
      this.emit('call-error', { error });
      this.endCall();
    }
  }

  // 接听来电
  public async acceptCall(): Promise<void> {
    try {
      if (!this.callState.isIncoming) {
        throw new Error('没有来电可接听');
      }

      const stream = await this.getUserMedia(this.callState.callType === 'video');
      
      // 创建 Peer 连接（接收方）
      this.peer = await createPeer({
        initiator: false,
        trickle: false,
        stream: stream
      });

      this.setupPeerEvents();
      this.callState.isInCall = true;
      this.callState.isIncoming = false;
      this.callState.callStartTime = Date.now();
      
      this.emit('call-accepted');
      toast.success('通话已接通');

    } catch (error) {
      console.error('接听通话失败:', error);
      this.emit('call-error', { error });
      this.rejectCall();
    }
  }

  // 拒绝来电
  public rejectCall(): void {
    this.callState.isIncoming = false;
    this.emit('call-rejected');
    this.cleanup();
    toast.info('已拒绝来电');
  }

  // 结束通话
  public endCall(): void {
    if (this.peer) {
      this.peer.destroy();
    }
    
    this.emit('call-ended');
    this.cleanup();
    toast.info('通话已结束');
  }

  // 设置 Peer 事件监听
  private setupPeerEvents(): void {
    if (!this.peer) return;

    this.peer.on('signal', (data) => {
      DEBUG_CALL && console.log('信令数据:', data);
      // 在实际应用中，这里应该通过信令服务器发送信令数据
    });

    this.peer.on('stream', (stream) => {
      DEBUG_CALL && console.log('接收到远程流');
      this.remoteStream = stream;
      this.callState.remoteStream = stream;
      this.callState.isInCall = true;
      this.emit('remote-stream-ready', { stream });
    });

    this.peer.on('connect', () => {
      DEBUG_CALL && console.log('Peer 连接已建立');
      this.callState.isInCall = true;
    });

    this.peer.on('error', (error) => {
      console.error('Peer 连接错误:', error);
      this.emit('call-error', { error });
      this.endCall();
    });

    this.peer.on('close', () => {
      DEBUG_CALL && console.log('Peer 连接已关闭');
      this.endCall();
    });
  }

  // 模拟远程流（用于演示）
  private async simulateRemoteStream(): Promise<void> {
    try {
      // 创建一个模拟的远程流
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        // 绘制一个简单的模拟视频画面
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ffffff';
        ctx.font = '24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('模拟远程视频', canvas.width / 2, canvas.height / 2);
      }
      
      // 将canvas转换为MediaStream
      const stream = canvas.captureStream(30);
      
      // 如果是语音通话，添加音频轨道
      if (this.callState.callType === 'voice') {
        try {
          const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
          const audioTrack = audioStream.getAudioTracks()[0];
          if (audioTrack) {
            stream.addTrack(audioTrack);
          }
        } catch (error) {
          console.warn('无法获取音频轨道:', error);
        }
      }
      
      this.remoteStream = stream;
      this.callState.remoteStream = stream;
      this.emit('remote-stream-ready', { stream });
      
    } catch (error) {
      console.error('创建模拟远程流失败:', error);
    }
  }

  // 模拟来电响应（用于演示）
  private simulateIncomingCallResponse(accepted: boolean): void {
    if (accepted) {
      // 模拟对方接听
      this.callState.isInCall = true;
      // 保持 isOutgoing 为 true，因为这是我们发起的通话
      // this.callState.isOutgoing = false; // 删除这行
      this.emit('call-accepted');
      toast.success('对方已接听');
      
      // 模拟创建一个远程流用于演示
      this.simulateRemoteStream();
    } else {
      // 模拟对方拒绝
      this.emit('call-rejected');
      this.endCall();
    }
  }

  // 静音/取消静音
  public toggleMute(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = this.callState.isMuted;
      });
      this.callState.isMuted = !this.callState.isMuted;
      toast.info(this.callState.isMuted ? '已静音' : '已取消静音');
    }
    return this.callState.isMuted;
  }

  // 开启/关闭视频
  public toggleVideo(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = this.callState.isVideoEnabled;
      });
      this.callState.isVideoEnabled = !this.callState.isVideoEnabled;
      toast.info(this.callState.isVideoEnabled ? '视频已开启' : '视频已关闭');
    }
    return this.callState.isVideoEnabled;
  }

  // 切换摄像头（前置/后置）
  public async switchCamera(): Promise<void> {
    try {
      if (this.localStream && this.callState.callType === 'video') {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
          // 获取当前摄像头设备ID
          const currentDeviceId = videoTrack.getSettings().deviceId;
          
          // 获取所有视频设备
          const devices = await navigator.mediaDevices.enumerateDevices();
          const videoDevices = devices.filter(device => device.kind === 'videoinput');
          
          if (videoDevices.length > 1) {
            // 找到下一个摄像头
            const currentIndex = videoDevices.findIndex(device => device.deviceId === currentDeviceId);
            const nextIndex = (currentIndex + 1) % videoDevices.length;
            const nextDevice = videoDevices[nextIndex];
            
            // 停止当前视频轨道
            videoTrack.stop();
            
            // 获取新的视频流
            const newStream = await navigator.mediaDevices.getUserMedia({
              audio: true,
              video: { deviceId: nextDevice.deviceId }
            });
            
            // 替换视频轨道
            const newVideoTrack = newStream.getVideoTracks()[0];
            if (this.peer) {
              const sender = this.peer._pc?.getSenders().find(s => 
                s.track && s.track.kind === 'video'
              );
              if (sender) {
                await sender.replaceTrack(newVideoTrack);
              }
            }
            
            // 更新本地流
            this.localStream.removeTrack(videoTrack);
            this.localStream.addTrack(newVideoTrack);
            
            toast.success('摄像头已切换');
          }
        }
      }
    } catch (error) {
      console.error('切换摄像头失败:', error);
      toast.error('切换摄像头失败');
    }
  }

  // 获取通话状态
  public getCallState(): CallState {
    return { ...this.callState };
  }

  // 获取通话时长
  public getCallDuration(): number {
    if (this.callState.callStartTime && this.callState.isInCall) {
      return Date.now() - this.callState.callStartTime;
    }
    return 0;
  }

  // 清理资源
  private cleanup(): void {
    // 停止本地媒体流
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    // 清理远程流
    this.remoteStream = null;

    // 重置通话状态
    this.callState = {
      isInCall: false,
      isIncoming: false,
      isOutgoing: false,
      callType: null,
      remoteUser: null,
      localStream: null,
      remoteStream: null,
      isMuted: false,
      isVideoEnabled: true,
      callStartTime: null
    };
  }

  // 模拟接收来电（用于演示）
  public simulateIncomingCall(remoteUser: CallUser, callType: 'voice' | 'video'): void {
    this.callState.isIncoming = true;
    this.callState.callType = callType;
    this.callState.remoteUser = remoteUser;
    
    this.emit('incoming-call', { remoteUser, callType });
    toast.info(`${remoteUser.name} 正在呼叫您...`);
  }
}

// 创建单例实例
export const callService = new CallService();
export default callService;