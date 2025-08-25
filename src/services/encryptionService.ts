import CryptoJS from 'crypto-js';

// 加密服务类
export class EncryptionService {
  private static instance: EncryptionService;
  private keyPairs: Map<string, { publicKey: string; privateKey: string }> = new Map();
  private sharedSecrets: Map<string, string> = new Map();
  
  private constructor() {}
  
  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }
  
  // 生成密钥对
  public generateKeyPair(userId: string): { publicKey: string; privateKey: string } {
    // 使用简化的密钥生成（实际应用中应使用更安全的方法）
    const privateKey = CryptoJS.lib.WordArray.random(256/8).toString();
    const publicKey = CryptoJS.SHA256(privateKey + userId).toString();
    
    const keyPair = { publicKey, privateKey };
    this.keyPairs.set(userId, keyPair);
    
    return keyPair;
  }
  
  // 获取用户的密钥对
  public getKeyPair(userId: string): { publicKey: string; privateKey: string } | null {
    return this.keyPairs.get(userId) || null;
  }
  
  // 生成共享密钥
  public generateSharedSecret(userId1: string, userId2: string): string {
    const chatId = [userId1, userId2].sort().join('-');
    
    if (this.sharedSecrets.has(chatId)) {
      return this.sharedSecrets.get(chatId)!;
    }
    
    const keyPair1 = this.getKeyPair(userId1);
    const keyPair2 = this.getKeyPair(userId2);
    
    if (!keyPair1 || !keyPair2) {
      throw new Error('密钥对不存在');
    }
    
    // 简化的共享密钥生成
    const sharedSecret = CryptoJS.SHA256(
      keyPair1.privateKey + keyPair2.publicKey + keyPair2.privateKey + keyPair1.publicKey
    ).toString();
    
    this.sharedSecrets.set(chatId, sharedSecret);
    return sharedSecret;
  }
  
  // 加密消息
  public encryptMessage(message: string, chatId: string): {
    encryptedContent: string;
    iv: string;
    timestamp: number;
  } {
    const sharedSecret = this.sharedSecrets.get(chatId);
    if (!sharedSecret) {
      throw new Error('共享密钥不存在');
    }
    
    const iv = CryptoJS.lib.WordArray.random(128/8);
    const encrypted = CryptoJS.AES.encrypt(message, sharedSecret, {
      iv: iv,
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7
    });
    
    return {
      encryptedContent: encrypted.toString(),
      iv: iv.toString(),
      timestamp: Date.now()
    };
  }
  
  // 解密消息
  public decryptMessage(encryptedData: {
    encryptedContent: string;
    iv: string;
    timestamp: number;
  }, chatId: string): string {
    const sharedSecret = this.sharedSecrets.get(chatId);
    if (!sharedSecret) {
      throw new Error('共享密钥不存在');
    }
    
    try {
      const decrypted = CryptoJS.AES.decrypt(encryptedData.encryptedContent, sharedSecret, {
        iv: CryptoJS.enc.Hex.parse(encryptedData.iv),
        mode: CryptoJS.mode.CBC,
        padding: CryptoJS.pad.Pkcs7
      });
      
      return decrypted.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      throw new Error('消息解密失败');
    }
  }
  
  // 验证消息完整性
  public verifyMessageIntegrity(message: string, signature: string, senderId: string): boolean {
    const keyPair = this.getKeyPair(senderId);
    if (!keyPair) {
      return false;
    }
    
    const expectedSignature = CryptoJS.HmacSHA256(message, keyPair.privateKey).toString();
    return signature === expectedSignature;
  }
  
  // 生成消息签名
  public signMessage(message: string, senderId: string): string {
    const keyPair = this.getKeyPair(senderId);
    if (!keyPair) {
      throw new Error('发送者密钥对不存在');
    }
    
    return CryptoJS.HmacSHA256(message, keyPair.privateKey).toString();
  }
  
  // 初始化聊天加密
  public initializeChatEncryption(userId1: string, userId2: string): string {
    // 确保两个用户都有密钥对
    if (!this.getKeyPair(userId1)) {
      this.generateKeyPair(userId1);
    }
    if (!this.getKeyPair(userId2)) {
      this.generateKeyPair(userId2);
    }
    
    // 生成共享密钥
    const sharedSecret = this.generateSharedSecret(userId1, userId2);
    const chatId = [userId1, userId2].sort().join('-');
    
    return chatId;
  }
  
  // 清除聊天加密数据
  public clearChatEncryption(chatId: string): void {
    this.sharedSecrets.delete(chatId);
  }
  
  // 导出公钥（用于密钥交换）
  public exportPublicKey(userId: string): string | null {
    const keyPair = this.getKeyPair(userId);
    return keyPair ? keyPair.publicKey : null;
  }
  
  // 导入公钥（用于与其他用户建立加密通信）
  public importPublicKey(userId: string, publicKey: string): void {
    const existingKeyPair = this.getKeyPair(userId);
    if (existingKeyPair) {
      // 更新公钥
      this.keyPairs.set(userId, {
        ...existingKeyPair,
        publicKey
      });
    } else {
      // 创建新的密钥对（只有公钥）
      this.keyPairs.set(userId, {
        publicKey,
        privateKey: '' // 远程用户的私钥我们不知道
      });
    }
  }
}

// 加密消息接口
export interface EncryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  encryptedContent: string;
  iv: string;
  signature: string;
  timestamp: number;
  messageType: 'text' | 'image' | 'file' | 'voice';
  isEncrypted: true;
}

// 解密后的消息接口
export interface DecryptedMessage {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: number;
  messageType: 'text' | 'image' | 'file' | 'voice';
  isVerified: boolean;
}

// 加密聊天管理器
export class EncryptedChatManager {
  private encryptionService: EncryptionService;
  private activeChatId: string | null = null;
  
  constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }
  
  // 开始加密聊天
  public startEncryptedChat(currentUserId: string, targetUserId: string): string {
    const chatId = this.encryptionService.initializeChatEncryption(currentUserId, targetUserId);
    this.activeChatId = chatId;
    return chatId;
  }
  
  // 发送加密消息
  public sendEncryptedMessage(
    content: string,
    senderId: string,
    receiverId: string,
    messageType: 'text' | 'image' | 'file' | 'voice' = 'text'
  ): EncryptedMessage {
    if (!this.activeChatId) {
      throw new Error('未初始化加密聊天');
    }
    
    const encryptedData = this.encryptionService.encryptMessage(content, this.activeChatId);
    const signature = this.encryptionService.signMessage(content, senderId);
    
    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      senderId,
      receiverId,
      encryptedContent: encryptedData.encryptedContent,
      iv: encryptedData.iv,
      signature,
      timestamp: encryptedData.timestamp,
      messageType,
      isEncrypted: true
    };
  }
  
  // 接收并解密消息
  public receiveEncryptedMessage(encryptedMessage: EncryptedMessage): DecryptedMessage {
    if (!this.activeChatId) {
      throw new Error('未初始化加密聊天');
    }
    
    const decryptedContent = this.encryptionService.decryptMessage({
      encryptedContent: encryptedMessage.encryptedContent,
      iv: encryptedMessage.iv,
      timestamp: encryptedMessage.timestamp
    }, this.activeChatId);
    
    const isVerified = this.encryptionService.verifyMessageIntegrity(
      decryptedContent,
      encryptedMessage.signature,
      encryptedMessage.senderId
    );
    
    return {
      id: encryptedMessage.id,
      senderId: encryptedMessage.senderId,
      receiverId: encryptedMessage.receiverId,
      content: decryptedContent,
      timestamp: encryptedMessage.timestamp,
      messageType: encryptedMessage.messageType,
      isVerified
    };
  }
  
  // 结束加密聊天
  public endEncryptedChat(): void {
    if (this.activeChatId) {
      this.encryptionService.clearChatEncryption(this.activeChatId);
      this.activeChatId = null;
    }
  }
  
  // 获取当前聊天ID
  public getCurrentChatId(): string | null {
    return this.activeChatId;
  }
}

export default EncryptionService;