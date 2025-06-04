// Shared TypeScript interfaces for Zesty SDK

export type AdFormat = 
  | 'medium-rectangle' 
  | 'billboard' 
  | 'mobile-phone-interstitial'
  | 'tall'  // deprecated
  | 'wide'  // deprecated 
  | 'square'; // deprecated

export type AdStyle = 'standard' | 'minimal' | 'transparent';

export type PlatformName = 'Oculus' | 'Wolvic' | 'Pico' | 'Desktop' | 'Unknown';

export type ConfidenceLevel = 'Full' | 'Partial' | 'None';

export interface PlatformDetectionResult {
  match: boolean;
  confidence: ConfidenceLevel;
}

export interface UserPlatform {
  platform: PlatformName;
  confidence: ConfidenceLevel;
}

export interface FormatStyle {
  standard: string;
  minimal: string;
  transparent: string;
}

export interface AdFormatDefinition {
  width: number;
  height: number;
  style: FormatStyle;
}

export interface AdFormats {
  [key: string]: AdFormatDefinition;
}

export interface Ad {
  asset_url: string;
  cta_url: string;
}

export interface Campaign {
  Ads: Ad[];
  CampaignId: string;
}

export interface UnitOverride {
  id: string;
  format: AdFormat;
  oldFormat: AdFormat;
  absoluteWidth: number;
  absoluteHeight: number;
}

export interface PrebidUrls {
  asset_url: string | null;
  cta_url: string | null;
}

export interface PrebidBids {
  asset_url?: string;
  cta_url?: string;
}

export interface VisibilityCheckParams {
  bbMin: number[];
  bbMax: number[];
  cameraProjMatrix: number[];
  cameraWorldMatrix: number[];
}

// GraphQL mutation response
export interface GraphQLResponse {
  data?: {
    increment?: {
      message: string;
    };
  };
  errors?: Array<{
    message: string;
    path?: string[];
  }>;
}

// Metrics event types
export type MetricEventType = 'visits' | 'clicks' | 'session';

export interface MetricsPlatform {
  name: PlatformName;
  confidence: ConfidenceLevel;
}