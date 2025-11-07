
export interface Farm {
  id: number;
  name: string;
  location: string;
  size: number;
  sizeUnit: string;
  description?: string;
  cropsCount?: number;
  livestockCount?: number;
  workersCount?: number;
  createdAt: string;  // Changed from Date to string to match service
  updatedAt: string;  // Changed from Date to string to match service
}

export interface CreateFarmRequest {
  name: string;
  location: string;
  size: number;
  sizeUnit: string;
  description?: string;
}

export interface UpdateFarmRequest {
  name?: string;
  location?: string;
  size?: number;
  sizeUnit?: string;
  description?: string;
}
