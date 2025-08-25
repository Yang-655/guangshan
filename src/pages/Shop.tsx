import React, { useState } from 'react';
import { ArrowLeft, Search, ShoppingCart, Filter, Star, Heart, Plus, Minus, Truck, CreditCard, MapPin, Clock, Package, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviews: number;
  seller: string;
  category: string;
  stock: number;
  description: string;
  isLiked: boolean;
}

interface CartItem {
  product: Product;
  quantity: number;
  selected: boolean;
}

interface Order {
  id: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: CartItem[];
  total: number;
  orderDate: string;
  deliveryDate?: string;
  trackingNumber?: string;
}

export default function Shop() {
  const navigate = useNavigate();
  const { success, info, error } = useToast();
  const [activeTab, setActiveTab] = useState<'products' | 'cart' | 'orders'>('products');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showCheckout, setShowCheckout] = useState(false);

  // 模拟商品数据
  const products: Product[] = [
    {
      id: '1',
      name: '智能手机支架 - 可调节角度',
      price: 29.9,
      originalPrice: 39.9,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=smartphone%20stand%20adjustable%20angle%20modern%20design&image_size=square',
      rating: 4.8,
      reviews: 1234,
      seller: '科技数码专营店',
      category: 'electronics',
      stock: 156,
      description: '多角度调节，稳固支撑，适用于各种尺寸手机',
      isLiked: false
    },
    {
      id: '2',
      name: '无线蓝牙耳机 - 降噪版',
      price: 199.0,
      originalPrice: 299.0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=wireless%20bluetooth%20headphones%20noise%20cancelling%20modern&image_size=square',
      rating: 4.6,
      reviews: 856,
      seller: '音频设备旗舰店',
      category: 'electronics',
      stock: 89,
      description: '主动降噪，长续航，高音质体验',
      isLiked: true
    },
    {
      id: '3',
      name: '时尚背包 - 大容量防水',
      price: 89.0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fashion%20backpack%20large%20capacity%20waterproof%20modern&image_size=square',
      rating: 4.7,
      reviews: 432,
      seller: '时尚生活馆',
      category: 'fashion',
      stock: 67,
      description: '防水面料，多层收纳，商务休闲两用',
      isLiked: false
    },
    {
      id: '4',
      name: '护肤套装 - 补水保湿',
      price: 158.0,
      originalPrice: 218.0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=skincare%20set%20moisturizing%20beauty%20products&image_size=square',
      rating: 4.9,
      reviews: 2156,
      seller: '美妆护肤专柜',
      category: 'beauty',
      stock: 234,
      description: '深层补水，温和保湿，适合各种肌肤',
      isLiked: true
    },
    {
      id: '5',
      name: '运动鞋 - 透气跑步鞋',
      price: 299.0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=running%20shoes%20breathable%20sports%20sneakers&image_size=square',
      rating: 4.5,
      reviews: 678,
      seller: '运动品牌直营',
      category: 'sports',
      stock: 123,
      description: '透气网面，缓震中底，舒适跑步体验',
      isLiked: false
    },
    {
      id: '6',
      name: '咖啡豆 - 精品单品豆',
      price: 68.0,
      image: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=premium%20coffee%20beans%20single%20origin%20package&image_size=square',
      rating: 4.8,
      reviews: 345,
      seller: '精品咖啡工坊',
      category: 'food',
      stock: 89,
      description: '单一产区，新鲜烘焙，浓郁香醇',
      isLiked: false
    }
  ];

  // 模拟订单数据
  const orders: Order[] = [
    {
      id: 'ORD001',
      status: 'shipped',
      items: [
        { product: products[0], quantity: 1, selected: true },
        { product: products[1], quantity: 1, selected: true }
      ],
      total: 228.9,
      orderDate: '2024-01-15',
      deliveryDate: '2024-01-18',
      trackingNumber: 'SF1234567890'
    },
    {
      id: 'ORD002',
      status: 'delivered',
      items: [
        { product: products[3], quantity: 2, selected: true }
      ],
      total: 316.0,
      orderDate: '2024-01-10',
      deliveryDate: '2024-01-13'
    }
  ];

  const categories = [
    { id: 'all', name: '全部', count: products.length },
    { id: 'electronics', name: '数码', count: products.filter(p => p.category === 'electronics').length },
    { id: 'fashion', name: '时尚', count: products.filter(p => p.category === 'fashion').length },
    { id: 'beauty', name: '美妆', count: products.filter(p => p.category === 'beauty').length },
    { id: 'sports', name: '运动', count: products.filter(p => p.category === 'sports').length },
    { id: 'food', name: '食品', count: products.filter(p => p.category === 'food').length }
  ];

  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToCart = (product: Product) => {
    const existingItem = cartItems.find(item => item.product.id === product.id);
    if (existingItem) {
      setCartItems(cartItems.map(item => 
        item.product.id === product.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
      success(`${product.name} 数量已增加`);
    } else {
      setCartItems([...cartItems, { product, quantity: 1, selected: true }]);
      success(`${product.name} 已加入购物车`);
    }
  };

  // 事件处理函数
  const handleSearch = () => {
    info('打开搜索功能');
    // 这里可以添加搜索功能的逻辑
  };

  const handleFilter = () => {
    info('打开筛选功能');
    // 这里可以添加筛选功能的逻辑
  };

  const handleLikeProduct = (productId: string) => {
    info('商品已添加到收藏');
    // 这里可以添加收藏商品的逻辑
  };

  const handlePayment = () => {
    const selectedItems = cartItems.filter(item => item.selected);
    if (selectedItems.length === 0) {
      error('请选择要购买的商品');
      return;
    }
    success(`订单提交成功！总金额：¥${getCartTotal().toFixed(2)}`);
    setShowCheckout(false);
    // 清空已购买的商品
    setCartItems(cartItems.filter(item => !item.selected));
    // 这里可以添加实际的支付逻辑
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      setCartItems(cartItems.filter(item => item.product.id !== productId));
    } else {
      setCartItems(cartItems.map(item => 
        item.product.id === productId 
          ? { ...item, quantity }
          : item
      ));
    }
  };

  const toggleCartItemSelection = (productId: string) => {
    setCartItems(cartItems.map(item => 
      item.product.id === productId 
        ? { ...item, selected: !item.selected }
        : item
    ));
  };

  const getCartTotal = () => {
    return cartItems
      .filter(item => item.selected)
      .reduce((total, item) => total + (item.product.price * item.quantity), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'text-yellow-600 bg-yellow-100';
      case 'paid': return 'text-blue-600 bg-blue-100';
      case 'shipped': return 'text-purple-600 bg-purple-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      case 'cancelled': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return '待付款';
      case 'paid': return '已付款';
      case 'shipped': return '已发货';
      case 'delivered': return '已送达';
      case 'cancelled': return '已取消';
      default: return '未知状态';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* 头部导航 */}
      <div className="bg-white px-4 py-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-semibold text-gray-800">商城</h1>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleSearch}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <Search className="w-5 h-5 text-gray-600" />
            </button>
            <button 
              onClick={() => setActiveTab('cart')}
              className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ShoppingCart className="w-5 h-5 text-gray-600" />
              {cartItems.length > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* 搜索框 */}
        {activeTab === 'products' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}

        {/* 标签切换 */}
        <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            商品
          </button>
          <button
            onClick={() => setActiveTab('cart')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'cart'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            购物车 ({cartItems.length})
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            订单
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="p-4">
        {activeTab === 'products' && (
          <div>
            {/* 分类筛选 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-gray-800">商品分类</h3>
                <button 
                  onClick={handleFilter}
                  className="flex items-center text-blue-600 text-sm"
                >
                  <Filter className="w-4 h-4 mr-1" />
                  筛选
                </button>
              </div>
              <div className="flex space-x-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {category.name} ({category.count})
                  </button>
                ))}
              </div>
            </div>

            {/* 商品网格 */}
            <div className="grid grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <div key={product.id} className="bg-white rounded-xl overflow-hidden shadow-sm">
                  <div className="relative">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-40 object-cover"
                    />
                    <button 
                      onClick={() => handleLikeProduct(product.id)}
                      className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                    >
                      <Heart className={`w-4 h-4 ${product.isLiked ? 'text-red-500 fill-current' : 'text-gray-600'}`} />
                    </button>
                    {product.originalPrice && (
                      <div className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                        特价
                      </div>
                    )}
                  </div>
                  <div className="p-3">
                    <h4 className="font-medium text-gray-800 text-sm mb-1 line-clamp-2">{product.name}</h4>
                    <div className="flex items-center mb-2">
                      <div className="flex items-center">
                        <Star className="w-3 h-3 text-yellow-400 fill-current" />
                        <span className="text-xs text-gray-600 ml-1">{product.rating}</span>
                      </div>
                      <span className="text-xs text-gray-400 ml-2">({product.reviews})</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center">
                        <span className="text-lg font-bold text-red-600">¥{product.price}</span>
                        {product.originalPrice && (
                          <span className="text-sm text-gray-400 line-through ml-2">¥{product.originalPrice}</span>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mb-3">{product.seller}</div>
                    <button 
                      onClick={() => addToCart(product)}
                      className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                    >
                      加入购物车
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'cart' && (
          <div>
            {cartItems.length > 0 ? (
              <div>
                <div className="space-y-4 mb-6">
                  {cartItems.map((item) => (
                    <div key={item.product.id} className="bg-white rounded-xl p-4">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => toggleCartItemSelection(item.product.id)}
                          className="mr-3 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                        <img
                          src={item.product.image}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg mr-3"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-800 mb-1">{item.product.name}</h4>
                          <div className="text-sm text-gray-500 mb-2">{item.product.seller}</div>
                          <div className="flex items-center justify-between">
                            <span className="text-lg font-bold text-red-600">¥{item.product.price}</span>
                            <div className="flex items-center">
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Minus className="w-4 h-4 text-gray-600" />
                              </button>
                              <span className="mx-3 font-medium">{item.quantity}</span>
                              <button 
                                onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                                className="p-1 hover:bg-gray-100 rounded"
                              >
                                <Plus className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 结算区域 */}
                <div className="bg-white rounded-xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-semibold text-gray-800">合计</span>
                    <span className="text-2xl font-bold text-red-600">¥{getCartTotal().toFixed(2)}</span>
                  </div>
                  <button 
                    onClick={() => setShowCheckout(true)}
                    disabled={cartItems.filter(item => item.selected).length === 0}
                    className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    去结算 ({cartItems.filter(item => item.selected).length})
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <ShoppingCart className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">购物车是空的</h3>
                <p className="text-sm text-gray-400 text-center mb-4">去商品页面添加一些商品吧！</p>
                <button 
                  onClick={() => setActiveTab('products')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  去购物
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'orders' && (
          <div>
            {orders.length > 0 ? (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="bg-white rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center">
                        <span className="font-medium text-gray-800 mr-3">订单号: {order.id}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusText(order.status)}
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">{order.orderDate}</span>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      {order.items.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <img
                            src={item.product.image}
                            alt={item.product.name}
                            className="w-12 h-12 object-cover rounded-lg mr-3"
                          />
                          <div className="flex-1">
                            <h5 className="font-medium text-gray-800 text-sm">{item.product.name}</h5>
                            <div className="text-xs text-gray-500">数量: {item.quantity}</div>
                          </div>
                          <span className="font-medium text-gray-800">¥{item.product.price}</span>
                        </div>
                      ))}
                    </div>
                    
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                      <div className="flex items-center space-x-4">
                        {order.status === 'shipped' && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Truck className="w-4 h-4 mr-1" />
                            <span>快递: {order.trackingNumber}</span>
                          </div>
                        )}
                        {order.deliveryDate && (
                          <div className="flex items-center text-sm text-gray-600">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>送达: {order.deliveryDate}</span>
                          </div>
                        )}
                      </div>
                      <span className="text-lg font-bold text-red-600">¥{order.total}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16">
                <Package className="w-16 h-16 text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-500 mb-2">暂无订单</h3>
                <p className="text-sm text-gray-400 text-center mb-4">您还没有任何订单记录</p>
                <button 
                  onClick={() => setActiveTab('products')}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                >
                  去购物
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 结算弹窗 */}
      {showCheckout && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="bg-white w-full rounded-t-2xl p-6 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-800">确认订单</h3>
              <button 
                onClick={() => setShowCheckout(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Plus className="w-5 h-5 text-gray-600 rotate-45" />
              </button>
            </div>
            
            {/* 收货地址 */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <MapPin className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-800">收货地址</span>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="font-medium text-gray-800 mb-1">张三 138****5678</div>
                <div className="text-sm text-gray-600">北京市朝阳区xxx街道xxx小区xxx号楼xxx室</div>
              </div>
            </div>
            
            {/* 商品清单 */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-800 mb-3">商品清单</h4>
              <div className="space-y-3">
                {cartItems.filter(item => item.selected).map((item) => (
                  <div key={item.product.id} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-12 h-12 object-cover rounded-lg mr-3"
                      />
                      <div>
                        <h5 className="font-medium text-gray-800 text-sm">{item.product.name}</h5>
                        <div className="text-xs text-gray-500">x{item.quantity}</div>
                      </div>
                    </div>
                    <span className="font-medium text-gray-800">¥{(item.product.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
            
            {/* 支付方式 */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <CreditCard className="w-5 h-5 text-gray-600 mr-2" />
                <span className="font-medium text-gray-800">支付方式</span>
              </div>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="wechat" defaultChecked className="mr-3" />
                  <span className="text-gray-800">微信支付</span>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input type="radio" name="payment" value="alipay" className="mr-3" />
                  <span className="text-gray-800">支付宝</span>
                </label>
              </div>
            </div>
            
            {/* 费用明细 */}
            <div className="mb-6">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">商品总价</span>
                  <span className="text-gray-800">¥{getCartTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">运费</span>
                  <span className="text-gray-800">¥0.00</span>
                </div>
                <div className="flex justify-between text-lg font-semibold pt-2 border-t border-gray-200">
                  <span className="text-gray-800">实付款</span>
                  <span className="text-red-600">¥{getCartTotal().toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            <button 
              onClick={handlePayment}
              className="w-full bg-red-600 text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors"
            >
              立即支付 ¥{getCartTotal().toFixed(2)}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}