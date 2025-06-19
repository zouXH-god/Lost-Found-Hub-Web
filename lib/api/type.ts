// api/types.ts
export interface LoginParams {
  username: string;
  password: string;
}

export interface ReportItemParams {
  item_name: string;
  description: string;
  image_id: number;
  location: string;
  contact_info?: string;
  lost_time: Date;
}

export interface ApproveItemParams {
  id: number;
}

export interface RejectItemParams {
  id: number;
}

export interface MarkClaimedParams {
  id: number;
  claimed_by?: string;
}

export interface GetAllItemsParams {
  offset?: string | number;
  limit?: string | number;
}

export interface UploadFileParams {
  file: File;
}

export interface GetFileParams {
  id: string;
  result_type?: 'file' | 'json';
  image_type?: 'thumbnail' | 'original';
}
