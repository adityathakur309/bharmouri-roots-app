import { apiRequest } from "./client";

export const shippingApi = {
  serviceability: (params: {
    deliveryPincode: string;
    weight?: number;
    cod?: boolean;
    pickupPincode?: string;
  }) => apiRequest("get", "/shipping/serviceability", undefined, params),

  estimate: (params: {
    deliveryPincode: string;
    weight?: number;
    cod?: boolean;
    pickupPincode?: string;
  }) => apiRequest("get", "/shipping/estimate", undefined, params),
};
