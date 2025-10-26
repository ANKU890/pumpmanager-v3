export interface SalesData {
  name: string;
  petrol: number;
  diesel: number;
  cash: number;
  transactions: number;
  avatarUrl: string;
}

export interface Settings {
    petrolRate: number;
    dieselRate: number;
    advanceCash: number;
}

export interface DailyReadings {
  petrol2pm: string;
  petrol10pm: string;
  diesel2pm: string;
  diesel10pm: string;
}

export enum FuelType {
  Petrol = 'petrol',
  Diesel = 'diesel',
}

export enum PaymentMode {
  Cash = 'cash',
  Paytm = 'paytm',
  Card = 'card',
  Bill = 'bill',
}

export enum TransactionType {
  Sale = 'sale',
  Deposit = 'deposit',
}

export enum VehicleType {
  Car = 'car',
  Bike = 'bike',
  Bus = 'bus',
  Truck = 'truck',
  Tractor = 'tractor',
  Pickup = 'pickup',
  Loader = 'loader',
  Other = 'other',
}

export interface Vehicle {
  number: string;
  type: VehicleType;
}

export interface Owner {
  id: string;
  name: string;
  vehicles: Vehicle[];
}

export interface Attendant {
  id: string;
  name: string;
  avatarUrl: string;
}

export interface Transaction {
  id: string;
  timestamp: string;
  type: TransactionType;
  // For Sale & Deposit
  fuelAmount: number; // for Sale: amount of fuel, for Deposit: amount deposited
  // For Sale only
  fuelType?: FuelType;
  fuelVolume?: number;
  paymentMode?: PaymentMode;
  amountPaid?: number;
  changeReturned?: number;
  vehicleNumber?: string;
  vehicleOwner?: string;
  vehicleType?: VehicleType;
  // Added for centralized view
  userName?: string;
  userAvatarUrl?: string;
}