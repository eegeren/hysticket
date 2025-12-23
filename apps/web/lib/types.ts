export type Category =
  | "INTERNET_WAN"
  | "LAN_WIFI"
  | "POS"
  | "PRINTER_BARCODE"
  | "PC_TABLET"
  | "ACCOUNT_ACCESS"
  | "APP_SERVER"
  | "OTHER";

export type Impact = "SALES_STOPPED" | "PARTIAL" | "INFO";
export type Priority = "P1" | "P2" | "P3" | "P4";
export type Status = "OPEN" | "IN_PROGRESS" | "WAITING_STORE" | "RESOLVED" | "CLOSED";
export type CloseCode = "FIXED" | "USER_ERROR" | "VENDOR" | "DUPLICATE" | "CANNOT_REPRODUCE" | "OTHER";

export type Store = {
  id: string;
  name: string;
  code: string;
  is_active: boolean;
};

export type Device = {
  id: string;
  label: string;
  type: string;
  serial?: string;
  store_id: string;
};

export type Comment = {
  id: string;
  ticket_id: string;
  author_role: "ADMIN" | "STORE";
  author_name: string;
  body: string;
  created_at: string;
};

export type Attachment = {
  id: string;
  ticket_id: string;
  uploader_role: "ADMIN" | "STORE";
  file_name: string;
  mime_type: string;
  size: number;
  url: string;
  created_at: string;
};

export type Ticket = {
  id: string;
  store_id: string;
  device_id?: string;
  requester_name: string;
  title: string;
  description: string;
  category: Category;
  impact: Impact;
  priority: Priority;
  status: Status;
  assigned_to?: string;
  created_at: string;
  updated_at: string;
  closed_at?: string;
  close_code?: CloseCode;
  resolution_note?: string;
  comments?: Comment[];
  attachments?: Attachment[];
};
