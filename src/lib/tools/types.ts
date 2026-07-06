export interface ToolSettingField {
  name: string;
  label: string;
  type: "select" | "slider" | "toggle" | "text" | "number";
  defaultValue: any;
  options?: string[]; // for select
  min?: number;       // for slider
  max?: number;       // for slider
  step?: number;      // for slider
}

export interface ToolMetadata {
  name: string;
  slug: string;
  category: "pdf" | "image";
  description: string;
  iconName: string; // Lucide icon lookup string
  color: "cyan" | "pink" | "emerald" | "violet";
  creditsCost: number;
  acceptedFileTypes: string[];
  outputFileTypes: string[];
  maxFileSizeBytes: number;
  seoTitle: string;
  seoDescription: string;
  schemaType: string; // Schema.org type (e.g. 'SoftwareApplication')
  settings: ToolSettingField[];
}
