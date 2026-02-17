import {
  Brand,
  Product,
  Material,
  User,
  UserPreference,
  Role,
  Order,
  OrderDetails,
  OrderDetail,
  OrderStatus,
  PaymentStatus,
  DeliveredOrder,
  CreateBrandData,
  UpdateBrandData,
  CreateProductData,
  UpdateProductData,
  CreateMaterialData,
  UpdateMaterialData,
  CreateUserData,
  UpdateUserData,
  UpdateUserPreferenceData,
  CreateRoleData,
  UpdateRoleData,
  CreateOrderData,
  UpdateOrderData,
  CreateOrderStatusData,
  UpdateOrderStatusData,
  CreatePaymentStatusData,
  UpdatePaymentStatusData,
  CreateDeliveredOrderData,
  UpdateDeliveredOrderData,
  DashboardStats,
  ProductInventoryItem,
  CheckoutOrderRequest,
  CheckoutOrderResult,
  OrderSummary,
  PasswordResetCompletePayload,
  PasswordResetRequestPayload,
  PasswordResetRequestResponse,
  PasswordResetStatus,
  TelegramVerificationRequestPayload,
  TelegramVerificationResponse,
  TelegramVerificationConfirmPayload,
  RegistrationRequestPayload,
  RegistrationRequestResponse,
  RegistrationConfirmPayload,
  RegistrationResendPayload,
  RegistrationResendResponse,
} from '@/shared/types';
import { clearAuthSession, getStoredAccessToken, refreshAuthSession } from '@/shared/lib/auth-client';
import { showGlobalToast } from '@/shared/ui/toast';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private buildConfig(options: RequestInit, token?: string | null): RequestInit {
    const headers = new Headers({
      'Content-Type': 'application/json',
    });

    if (options.headers) {
      const extraHeaders = new Headers(options.headers as HeadersInit);
      extraHeaders.forEach((value, key) => headers.set(key, value));
    }

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    return {
      ...options,
      headers,
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    let token = getStoredAccessToken();
    let response = await fetch(url, this.buildConfig(options, token));
    let responseClone = response.clone();

    if (response.status === 401) {
      try {
        const newToken = await refreshAuthSession();
        if (newToken) {
          token = newToken;
          response = await fetch(url, this.buildConfig(options, token));
          responseClone = response.clone();
        }
      } catch (refreshError) {
        clearAuthSession();
        throw refreshError instanceof Error
          ? refreshError
          : new Error('Не удалось обновить токен');
      }
    }

    if (response.status === 401) {
      clearAuthSession();
      throw new Error('Требуется повторный вход');
    }

    try {
      if (!response.ok) {
        let errorDetail = 'Не удалось выполнить запрос';
        try {
          const errorData = await responseClone.json();
          if (errorData) {
            const modelErrors =
              errorData.errors &&
              Object.values(errorData.errors)
                .flat()
                .filter(Boolean)
                .join(' ');
            errorDetail =
              modelErrors ||
              errorData.details ||
              errorData.message ||
              JSON.stringify(errorData);
          }
        } catch {
          try {
            const text = await responseClone.text();
            if (text) {
              errorDetail = text;
            }
          } catch {
            // ignore
          }
        }

        const hasCyrillic = /[а-яё]/i.test(errorDetail);
        const userMessage = hasCyrillic ? errorDetail : 'Произошла неожиданная ошибка. Попробуйте позже.';
        showGlobalToast(userMessage, 'error');
        const err = new Error(userMessage);
        (err as Error & { detail?: string }).detail = errorDetail;
        throw err;
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return {} as T;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      throw error;
    }
  }

  // Brands API
  async getBrands(): Promise<Brand[]> {
    return this.request<Brand[]>('/Brand');
  }

  async getBrand(id: number): Promise<Brand> {
    return this.request<Brand>(`/Brand/${id}`);
  }

  async createBrand(data: CreateBrandData): Promise<Brand> {
    return this.request<Brand>('/Brand', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateBrand(id: number, data: UpdateBrandData): Promise<void> {
    return this.request<void>(`/Brand/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteBrand(id: number): Promise<void> {
    return this.request<void>(`/Brand/${id}`, {
      method: 'DELETE',
    });
  }

  // Products API
  async getProducts(): Promise<Product[]> {
    return this.request<Product[]>('/Product');
  }

  async getProductCatalog(): Promise<ProductInventoryItem[]> {
    return this.request<ProductInventoryItem[]>('/Product/catalog');
  }

  async getProduct(id: number): Promise<Product> {
    return this.request<Product>(`/Product/${id}`);
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    return this.request<Product>('/Product', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduct(id: number, data: UpdateProductData): Promise<void> {
    return this.request<void>(`/Product/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteProduct(id: number): Promise<void> {
    return this.request<void>(`/Product/${id}`, {
      method: 'DELETE',
    });
  }

  // Materials API
  async getMaterials(): Promise<Material[]> {
    return this.request<Material[]>('/Material');
  }

  async getMaterial(id: number): Promise<Material> {
    return this.request<Material>(`/Material/${id}`);
  }

  async createMaterial(data: CreateMaterialData): Promise<Material> {
    return this.request<Material>('/Material', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateMaterial(id: number, data: UpdateMaterialData): Promise<void> {
    return this.request<void>(`/Material/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteMaterial(id: number): Promise<void> {
    return this.request<void>(`/Material/${id}`, {
      method: 'DELETE',
    });
  }

  // Users API
  async getUsers(): Promise<User[]> {
    return this.request<User[]>('/User');
  }

  async getUser(id: number): Promise<User> {
    return this.request<User>(`/User/${id}`);
  }

  async createUser(data: CreateUserData): Promise<User> {
    return this.request<User>('/User', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateUser(id: number, data: UpdateUserData): Promise<void> {
    return this.request<void>(`/User/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteUser(id: number): Promise<void> {
    return this.request<void>(`/User/${id}`, {
      method: 'DELETE',
    });
  }

  // User Preferences API
  async getUserPreference(userId: number): Promise<UserPreference> {
    return this.request<UserPreference>(`/UserPreferences/${userId}`);
  }

  async upsertUserPreference(data: UpdateUserPreferenceData): Promise<UserPreference> {
    return this.request<UserPreference>(`/UserPreferences/${data.userId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Roles API
  async getRoles(): Promise<Role[]> {
    return this.request<Role[]>('/Role');
  }

  async getRole(id: number): Promise<Role> {
    return this.request<Role>(`/Role/${id}`);
  }

  async createRole(data: CreateRoleData): Promise<Role> {
    return this.request<Role>('/Role', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateRole(id: number, data: UpdateRoleData): Promise<void> {
    return this.request<void>(`/Role/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteRole(id: number): Promise<void> {
    return this.request<void>(`/Role/${id}`, {
      method: 'DELETE',
    });
  }

  // Orders API
  async getOrders(): Promise<OrderSummary[]> {
    return this.request<OrderSummary[]>('/Order');
  }

  async getOrder(id: number): Promise<OrderDetails> {
    return this.request<OrderDetails>(`/Order/${id}`);
  }

  async createOrder(data: CreateOrderData): Promise<Order> {
    return this.request<Order>('/Order', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrder(id: number, data: UpdateOrderData): Promise<void> {
    return this.request<void>(`/Order/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrder(id: number): Promise<void> {
    return this.request<void>(`/Order/${id}`, {
      method: 'DELETE',
    });
  }

  async checkoutOrder(data: CheckoutOrderRequest): Promise<CheckoutOrderResult> {
    return this.request<CheckoutOrderResult>('/Order/checkout', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Order Details API
  async getOrderDetails(): Promise<OrderDetail[]> {
    return this.request<OrderDetail[]>('/OrderDetail');
  }

  async getOrderDetail(id: number): Promise<OrderDetail> {
    return this.request<OrderDetail>(`/OrderDetail/${id}`);
  }

  async createOrderDetail(data: Omit<OrderDetail, 'order' | 'product'>): Promise<OrderDetail> {
    return this.request<OrderDetail>('/OrderDetail', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderDetail(id: number, data: Omit<OrderDetail, 'order' | 'product'>): Promise<void> {
    return this.request<void>(`/OrderDetail/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrderDetail(id: number): Promise<void> {
    return this.request<void>(`/OrderDetail/${id}`, {
      method: 'DELETE',
    });
  }

  // Order Status API
  async getOrderStatuses(): Promise<OrderStatus[]> {
    return this.request<OrderStatus[]>('/OrderStatus');
  }

  async getOrderStatus(id: number): Promise<OrderStatus> {
    return this.request<OrderStatus>(`/OrderStatus/${id}`);
  }

  async createOrderStatus(data: CreateOrderStatusData): Promise<OrderStatus> {
    return this.request<OrderStatus>('/OrderStatus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateOrderStatus(id: number, data: UpdateOrderStatusData): Promise<void> {
    return this.request<void>(`/OrderStatus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteOrderStatus(id: number): Promise<void> {
    return this.request<void>(`/OrderStatus/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment Status API
  async getPaymentStatuses(): Promise<PaymentStatus[]> {
    return this.request<PaymentStatus[]>('/PaymentStatus');
  }

  async getPaymentStatus(id: number): Promise<PaymentStatus> {
    return this.request<PaymentStatus>(`/PaymentStatus/${id}`);
  }

  async createPaymentStatus(data: CreatePaymentStatusData): Promise<PaymentStatus> {
    return this.request<PaymentStatus>('/PaymentStatus', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updatePaymentStatus(id: number, data: UpdatePaymentStatusData): Promise<void> {
    return this.request<void>(`/PaymentStatus/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deletePaymentStatus(id: number): Promise<void> {
    return this.request<void>(`/PaymentStatus/${id}`, {
      method: 'DELETE',
    });
  }

  // Delivered Orders API
  async getDeliveredOrders(): Promise<DeliveredOrder[]> {
    return this.request<DeliveredOrder[]>('/DeliveredOrder');
  }

  async getDeliveredOrder(id: number): Promise<DeliveredOrder> {
    return this.request<DeliveredOrder>(`/DeliveredOrder/${id}`);
  }

  async createDeliveredOrder(data: CreateDeliveredOrderData): Promise<DeliveredOrder> {
    return this.request<DeliveredOrder>('/DeliveredOrder', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateDeliveredOrder(id: number, data: UpdateDeliveredOrderData): Promise<void> {
    return this.request<void>(`/DeliveredOrder/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteDeliveredOrder(id: number): Promise<void> {
    return this.request<void>(`/DeliveredOrder/${id}`, {
      method: 'DELETE',
    });
  }

  // Registration API
  async requestRegistration(data: RegistrationRequestPayload): Promise<RegistrationRequestResponse> {
    return this.request<RegistrationRequestResponse>('/Registration/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmRegistration(data: RegistrationConfirmPayload): Promise<void> {
    return this.request<void>('/Registration/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async resendRegistrationCode(data: RegistrationResendPayload): Promise<RegistrationResendResponse> {
    return this.request<RegistrationResendResponse>('/Registration/resend', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Password Reset API
  async requestPasswordReset(data: PasswordResetRequestPayload): Promise<PasswordResetRequestResponse> {
    return this.request<PasswordResetRequestResponse>('/PasswordReset/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async completePasswordReset(data: PasswordResetCompletePayload): Promise<void> {
    return this.request<void>('/PasswordReset/complete', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async checkPasswordResetToken(token: string): Promise<PasswordResetStatus> {
    return this.request<PasswordResetStatus>(`/PasswordReset/status/${token}`);
  }

  async requestTelegramVerification(
    data: TelegramVerificationRequestPayload
  ): Promise<TelegramVerificationResponse> {
    return this.request<TelegramVerificationResponse>('/TelegramVerification/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmTelegramVerification(
    data: TelegramVerificationConfirmPayload
  ): Promise<void> {
    return this.request<void>('/TelegramVerification/confirm', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Dashboard API
  async getDashboardStats(): Promise<DashboardStats> {
    return this.request<DashboardStats>('/Analytics/dashboard');
  }

  async getAnalyticsDashboard(): Promise<DashboardStats> {
    return this.getDashboardStats();
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
