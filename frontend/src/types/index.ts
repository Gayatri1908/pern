// ============================================================
// The Source Company — Shared TypeScript Types
// ============================================================

export type UserRole = "Super Admin" | "Admin" | "Operator" | "Customer";

// ── The Source Company Energy System Platform Types ──
export type SystemOperatingStatus = "ONLINE" | "OFFLINE" | "STANDBY" | "MAINTENANCE" | "FAULT";
export type SystemHealthStatus = "GOOD" | "FAIR" | "WARNING" | "CRITICAL";

export interface EnergySystem {
  id: string;
  system_name: string;
  model: string;
  serial_number: string;
  location: string;
  latitude: number;
  longitude: number;
  rated_power_kw: number;
  current_power_kw: number;
  energy_today_kwh: number;
  energy_lifetime_mwh: number;
  status: SystemOperatingStatus;
  health_status: SystemHealthStatus;
  availability_pct: number;
  efficiency_pct: number;
  last_telemetry_at: string;
  active_alerts_count: number;
  commission_date: string;
  configuration?: SystemConfiguration;
  components?: SystemComponent[];
  active_alerts?: PlatformAlert[];
  latest_telemetry?: TelemetryRecord;
  health_assessment?: SystemHealthDiagnostic;
}

export interface SystemConfiguration {
  system_id: string;
  cut_in_wind_speed: number;
  cut_out_wind_speed: number;
  max_altitude_m: number;
  max_tension_kn: number;
  max_rotor_rpm: number;
  overtemp_threshold_c?: number;
  low_voltage_cutoff_v?: number;
  updated_at?: string;
}

export type ComponentType =
  | "Generator"
  | "Power Electronics"
  | "Control System"
  | "Sensors"
  | "Mechanical"
  | "Communication"
  | "Energy Storage";

export interface SystemComponent {
  id: string;
  system_id: string;
  component_name: string;
  component_type: ComponentType;
  serial_number: string;
  status: "ONLINE" | "WARNING" | "FAULT" | "OFFLINE";
  health_score: number;
  operating_hours: number;
  last_maintenance_date?: string;
  next_maintenance_date?: string;
  system_name?: string;
  model?: string;
  location?: string;
}

export interface TelemetryRecord {
  id: number;
  system_id: string;
  timestamp: string;
  power_output_kw: number;
  voltage_v: number;
  current_a: number;
  wind_speed_ms: number;
  wind_direction_deg: number;
  tether_tension_kn: number;
  rotor_rpm: number;
  flight_altitude_m: number;
  temperature_c: number;
  battery_soc_pct: number;
  system_load_pct: number;
  efficiency_pct: number;
}

export interface SystemHealthDiagnostic {
  id: number;
  system_id: string;
  timestamp: string;
  overall_health_score: number;
  aerodynamics_score: number;
  tether_winch_score: number;
  generator_score: number;
  power_electronics_score: number;
  storage_score: number;
  control_avionics_score: number;
  fault_count: number;
  warning_count: number;
}

export interface PlatformAlert {
  id: string;
  system_id: string;
  alert_type: string;
  severity: "INFO" | "WARNING" | "CRITICAL";
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  title: string;
  description: string;
  threshold_breached?: string;
  triggered_at: string;
  acknowledged_at?: string;
  acknowledged_by?: string;
  resolved_at?: string;
  resolved_by?: string;
  system_name?: string;
  model?: string;
  location?: string;
}

export interface OperationalMaintenanceRecord {
  id: string;
  system_id: string;
  component_id?: string;
  maintenance_type: "PREVENTATIVE" | "CORRECTIVE" | "EMERGENCY" | "INSPECTION";
  status: "SCHEDULED" | "IN PROGRESS" | "COMPLETED" | "OVERDUE";
  title: string;
  description: string;
  scheduled_date: string;
  completed_date?: string;
  technician: string;
  notes?: string;
  next_due_date?: string;
  created_at?: string;
  system_name?: string;
  component_name?: string;
  location?: string;
}

export interface MissionControlData {
  total_systems: number;
  active_systems: number;
  online_systems: number;
  offline_systems: number;
  standby_systems: number;
  maintenance_systems: number;
  fault_systems: number;
  rated_capacity_kw: number;
  current_power_output_kw: number;
  energy_generated_today_kwh: number;
  energy_generated_lifetime_mwh: number;
  system_availability_pct: number;
  system_efficiency_pct: number;
  active_alerts: number;
  critical_alerts: number;
  fleet_health_score: number;
  operating_conditions: {
    average_wind_speed_ms: number;
    ambient_temperature_c: number;
    air_density_kg_m3: number;
    weather_summary: string;
  };
}


export interface User {
  id: string;
  email: string;
  phone?: string;
  role: UserRole;
  is_2fa_enabled: boolean;
  is_active: boolean;
  approval_status?: "pending" | "approved" | "rejected";
  verification_notes?: string;
  approved_by_id?: string;
  reviewed_at?: string;
  company_id?: string;
  custom_id?: string;
  company?: Company;
  created_at: string;
  updated_at: string;
  deletion_requested_at?: string;
  deletion_reason?: string;
}

export interface Company {
  id: string;
  name: string;
  gst_number?: string;
  gst_no?: string;
  address?: string;
  company_type?: string;
  city?: string;
  state?: string;
  pincode?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: User;
}

// ── Product ──
export type ProductStatus = "online" | "offline" | "failed" | "maintenance";
export type ProductCategory = "wind_turbine" | "solar" | "hybrid" | "battery_storage" | "ev_charging_hub" | "battery_storage_station";

export interface Product {
  id: string;
  product_code: string;
  serial_number: string;
  category: ProductCategory;
  status: ProductStatus;
  firmware_version?: string;
  install_lat?: number;
  install_lng?: number;
  owner_user_id?: string;
  owner?: User;
  battery_health?: number;
  battery_capacity_kwh?: number;
  current_charge_pct?: number;
  total_ports?: number;
  available_ports?: number;
  charger_type?: string;
  battery_type?: string;
  charging_price_per_kwh?: number;
  station_address?: string;
  station_name?: string;
  created_at: string;
  updated_at: string;
}

// ── Telemetry ──
export interface TelemetryPoint {
  time: string;
  voltage?: number;
  current?: number;
  power?: number;
  wind_speed?: number;
  rpm?: number;
  temperature?: number;
  battery_soc?: number;
  energy_kwh?: number;
}

export interface LiveTelemetry {
  product_id: string;
  timestamp: string;
  voltage: number;
  current: number;
  power: number;
  wind_speed: number;
  rpm: number;
  temperature: number;
  battery_soc: number;
  energy_kwh: number;
}

// ── Alert ──
export type AlertSeverity = "info" | "warning" | "critical";
export type AlertStatus = "open" | "acknowledged" | "resolved";

export interface Alert {
  id: string;
  product_id: string;
  product?: Product;
  metric: string;
  value: number;
  severity: AlertSeverity;
  status: AlertStatus;
  suggested_solution?: string;
  assigned_engineer_id?: string;
  created_at: string;
  updated_at: string;
}

// ── Complaint ──
export type ComplaintStatus = "open" | "in_progress" | "resolved" | "closed";
export type ComplaintPriority = "low" | "medium" | "high" | "urgent";

export interface Complaint {
  id: string;
  product_id: string;
  product?: Product;
  category: string;
  description?: string;
  priority: ComplaintPriority;
  status: ComplaintStatus;
  media_urls?: string[];
  resolution_notes?: string;
  resolved_at?: string;
  created_at: string;
  updated_at: string;
}

// ── Maintenance ──
export type MaintenanceType =
  | "routine"
  | "battery_check"
  | "rotor_calibration"
  | "firmware_update"
  | "sensor_replacement"
  | "rope_tension_check"
  | "emergency_repair";

export interface MaintenanceRecord {
  id: string;
  product_id: string;
  product?: Product;
  type: MaintenanceType;
  scheduled_at?: string;
  completed_at?: string;
  parts_replaced?: string[];
  engineer_id?: string;
  notes?: string;
  created_at: string;
}

// ── Registration Request ──
export type RegistrationStatus = "pending" | "approved" | "rejected";

export interface RegistrationRequest {
  id: string;
  user_id: string;
  user?: User;
  request_type?: string;
  serial_number: string;
  invoice_url?: string;
  gps_lat?: number;
  gps_lng?: number;
  status: RegistrationStatus;
  reviewed_by_id?: string;
  notes?: string;
  details?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

// ── Analytics ──
export interface AnalyticsSummary {
  total_products: number;
  online_products: number;
  offline_products: number;
  failed_products: number;
  maintenance_products: number;
  total_users: number;
  pending_requests: number;
  critical_alerts: number;
  open_complaints: number;
  today_energy_kwh: number;
  month_energy_kwh: number;
  lifetime_energy_kwh: number;
  co2_saved_kg: number;
  avg_efficiency_pct: number;
}

// ── Audit Log ──
export interface AuditLog {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details?: Record<string, unknown>;
  ip_address?: string;
  created_at: string;
}

// ── Weather ──
export interface WeatherData {
  location: string;
  timestamp: string;
  wind_speed_ms: number;
  wind_direction_deg: number;
  temperature_c: number;
  humidity_pct: number;
  pressure_hpa: number;
  rainfall_mm: number;
  condition: string;
  condition_icon: string;
  air_density_kg_m3: number;
}

// ── API helpers ──
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
  pages: number;
}

export interface ApiError {
  detail: string;
  code?: string;
}

export type NotifPrefs = {
  email_offline: boolean;
  email_threshold: boolean;
  email_complaint: boolean;
  email_registration: boolean;
  inapp_offline: boolean;
  inapp_threshold: boolean;
  inapp_complaint: boolean;
  inapp_registration: boolean;
};
