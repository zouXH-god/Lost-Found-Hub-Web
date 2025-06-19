
// api/request.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApproveItemParams, GetAllItemsParams, GetFileParams, LoginParams, MarkClaimedParams, RejectItemParams, ReportItemParams, UploadFileParams } from './type';

class ApiClient {
  private instance: AxiosInstance;
  public token: string | null = null;

  constructor(baseURL: string) {
    this.instance = axios.create({
      baseURL,
      timeout: 10000,
    });

    // 请求拦截器
    this.instance.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // 修改后的响应拦截器
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        // 直接返回完整的响应对象，让调用方处理.data
        return response;
      },
      (error) => {
        // 统一错误处理
        if (error.response) {
          // 服务器返回了错误状态码 (4xx, 5xx)
          console.error('API error response:', error.response.status, error.response.data);
        } else if (error.request) {
          // 请求已发出但没有收到响应
          console.error('API no response:', error.request);
        } else {
          // 请求设置出错
          console.error('API request setup error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  async request<T>(config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    try {
      const response = await this.instance.request<T>(config);
      return response;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  // 修改后的login方法
  async login(params: LoginParams): Promise<AxiosResponse<any>> {
    const formData = new FormData();
    formData.append('username', params.username);
    formData.append('password', params.password);

    return this.request({
      method: 'POST',
      url: '/api/auth/login',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 公共接口
  async getFoundItems(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/found-items',
    });
  }

  async getLostItems(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/lost-items',
    });
  }

  async reportLost(params: ReportItemParams): Promise<any> {
    const formData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      if (key == "lost_time" && value !== undefined) {
        formData.append(key, new Date(value).toISOString());
      }else if (value !== undefined) {
        formData.append(key, value);
      }
    });

    return this.request({
      method: 'POST',
      url: '/api/report-lost',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async reportFound(params: ReportItemParams): Promise<any> {
    const formData = new FormData();
    Object.entries(params).forEach(([key, value]) => {
      if (key == "lost_time" && value !== undefined) {
        formData.append(key, new Date(value).toISOString());
      }else if (value !== undefined) {
        formData.append(key, value);
      }
    });

    return this.request({
      method: 'POST',
      url: '/api/report-found',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  // 管理员接口
  async getPendingItems(): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/admin/pending-items',
    });
  }

  async approveItem(params: ApproveItemParams): Promise<any> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/approve-item/${params.id}`,
    });
  }

  async rejectItem(params: RejectItemParams): Promise<any> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/reject-item/${params.id}`,
    });
  }

  async markClaimed(params: MarkClaimedParams): Promise<any> {
    return this.request({
      method: 'PUT',
      url: `/api/admin/mark-claimed/${params.id}`,
      params: {
        claimed_by: params.claimed_by,
      },
    });
  }

  async getAllItems(params?: GetAllItemsParams): Promise<any> {
    return this.request({
      method: 'GET',
      url: '/api/admin/all-items',
      params,
    });
  }

  // 文件接口
  async uploadFile(params: UploadFileParams): Promise<any> {
    const formData = new FormData();
    formData.append('file', params.file);

    return this.request({
      method: 'POST',
      url: '/api/files/upload',
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getFile(params: GetFileParams): Promise<any> {
    return this.request({
      method: 'GET',
      url: `/api/files/${params.id}`,
      params: {
        result_type: params.result_type,
        image_type: params.image_type,
      },
    });
  }
}

// 根据实际环境配置 baseURL
export const baseURL = process.env.REACT_APP_API_BASE_URL || 'http://10.0.20.2:5417';

export const apiClient = new ApiClient(baseURL);