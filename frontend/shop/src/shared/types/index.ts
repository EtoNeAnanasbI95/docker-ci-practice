// API Types based on C# models

export interface Brand {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  products?: Product[];
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  brandId: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  brand?: Brand;
  materials?: Material[];
}

export interface ProductInventoryItem {
  id: number;
  name: string;
  description?: string;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
  brandName: string;
  materials: string[];
}

export interface UserOrdersSummary {
  userId: number;
  login: string;
  telegramUsername: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt?: string;
}

export interface AnalyticsRecentOrder {
  id: number;
  customer: string;
  orderStatus: string;
  paymentStatus: string;
  orderDate: string;
}

export interface AnalyticsLowStockProduct {
  id: number;
  name: string;
  brand: string;
  stockQuantity: number;
}

export interface BrandSalesAnalytics {
  brandId: number;
  brand: string;
  orders: number;
  deliveredOrders: number;
  units: number;
  revenue: number;
  averageOrderValue: number;
}

export interface Material {
  id: number;
  name: string;
  isDeleted: boolean;
  createdAt: string;
  updatedAt: string;
  products?: Product[];
}

export interface UserPreference {
  userId: number;
  theme: string;
  updatedAt: string;
}

export interface UpdateUserPreferenceData {
  userId: number;
  theme: string;
}

export interface CheckoutOrderItem {
  productId: number;
  quantity: number;
}

export interface CheckoutOrderRequest {
  userId: number;
  items: CheckoutOrderItem[];
  paymentStatusId?: number;
  orderStatusId?: number;
}

export interface CheckoutOrderResult {
  orderId: number;
  totalAmount: number;
}

export interface OrderSummary {
  id: number;
  userId: number;
  orderDate: string;
  totalAmount: number;
  orderStatusId: number;
  orderStatus: string;
  paymentStatusId: number;
  paymentStatus: string;
  customerLogin?: string | null;
  customerName?: string | null;
  customerTelegram?: string | null;
  deliveredOrder?: DeliveredOrder;
}

export interface OrderItem {
  productId: number;
  productName: string;
  quantity: number;
  priceAtMoment: number;
}

export interface OrderDetails extends OrderSummary {
  items: OrderItem[];
}

export interface User {
  id: number;
  login: string;
  telegramUsername: string;
  telegramChatId?: number | null;
  telegramVerified: boolean;
  roleId: number;
  fullName?: string;
  creationDatetime: string;
  updateDatetime?: string;
  lastLoginAt?: string;
  isArchived: boolean;
  isDeleted: boolean;
  role?: Role;
  orders?: Order[];
  userPreference?: UserPreference;
}

export interface Role {
  id: number;
  name: string;
  createdAt: string;
  users?: User[];
}

export interface Order {
  id: number;
  userId: number;
  orderStatusId: number;
  paymentStatusId: number;
  orderDate: string;
  totalAmount: number;
  deliveryAddress?: string;
  paymentMethod?: string;
  isDeleted: boolean;
  user?: User;
  orderStatus?: OrderStatus;
  paymentStatus?: PaymentStatus;
  orderDetails?: OrderDetail[];
  deliveredOrder?: DeliveredOrder;
}

export interface OrderDetail {
  orderId: number;
  productId: number;
  quantity: number;
  priceAtMoment: number;
  order?: Order;
  product?: Product;
}

export interface OrderStatus {
  id: number;
  name: string;
  createdAt: string;
  orders?: Order[];
}

export interface PaymentStatus {
  id: number;
  name: string;
  createdAt: string;
  orders?: Order[];
}

export interface DeliveredOrder {
  orderId: number;
  deliveryDate: string;
  courierName: string;
  order?: Order;
}

// Form types for creating/updating entities
export interface CreateBrandData {
  name: string;
}

export interface UpdateBrandData extends CreateBrandData {
  id: number;
}

export interface CreateProductData {
  name: string;
  description?: string;
  brandId: number;
  price: number;
  stockQuantity: number;
  imageUrl?: string;
}

export interface UpdateProductData extends CreateProductData {
  id: number;
}

export interface CreateMaterialData {
  name: string;
}

export interface UpdateMaterialData extends CreateMaterialData {
  id: number;
}

export interface CreateUserData {
  login: string;
  telegramUsername: string;
  telegramChatId?: number | null;
  password: string;
  roleId: number;
  fullName: string;
}

export interface UpdateUserData {
  id: number;
  login: string;
  telegramUsername: string;
  telegramChatId?: number | null;
  roleId: number;
  fullName: string;
  isArchived: boolean;
}

export interface CreateRoleData {
  name: string;
}

export interface UpdateRoleData extends CreateRoleData {
  id: number;
}

export interface CreateOrderData {
  userId: number;
  orderStatusId: number;
  paymentStatusId: number;
  orderDate: string;
}

export interface UpdateOrderData extends CreateOrderData {
  id: number;
  deliveryDate?: string | null;
  courierName?: string | null;
}

export interface CreateOrderStatusData {
  name: string;
}

export interface UpdateOrderStatusData extends CreateOrderStatusData {
  id: number;
}

export interface CreatePaymentStatusData {
  name: string;
}

export interface UpdatePaymentStatusData extends CreatePaymentStatusData {
  id: number;
}

export interface CreateDeliveredOrderData {
  orderId: number;
  deliveryDate: string;
  courierName: string;
}

export interface UpdateDeliveredOrderData extends CreateDeliveredOrderData {
  orderId: number;
}

// API Response types
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
  totalPages: number;
}

// Dashboard statistics
export interface DashboardStats {
  totalProducts: number;
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: AnalyticsRecentOrder[];
  lowStockProducts: AnalyticsLowStockProduct[];
  topCustomers: UserOrdersSummary[];
  salesByBrand: BrandSalesAnalytics[];
}

export interface PasswordResetRequestPayload {
  loginOrTelegram: string;
}

export interface PasswordResetRequestResponse {
  token: string;
  sent?: boolean;
}

export interface PasswordResetStatus {
  token: string;
  isActive: boolean;
  expiresAt?: string;
  consumedAt?: string;
  isRevoked: boolean;
}

export interface PasswordResetCompletePayload {
  token: string;
  newPassword: string;
}

export interface TelegramVerificationRequestPayload {
  userId: number;
  telegramUsername: string;
  telegramChatId?: number | null;
}

export interface TelegramVerificationResponse {
  tokenId: number;
  expiresAt: string;
  sent: boolean;
}

export interface TelegramVerificationConfirmPayload {
  userId: number;
  code: string;
}

export interface RegistrationRequestPayload {
  login: string;
  password: string;
  fullName: string;
  telegramUsername: string;
}

export interface RegistrationRequestResponse {
  registrationId: string;
  expiresAt: string;
}

export interface RegistrationConfirmPayload {
  registrationId: string;
  code: string;
}

export interface RegistrationResendPayload {
  registrationId: string;
}

export interface RegistrationResendResponse {
  expiresAt: string;
}
