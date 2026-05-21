/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ServiceProfile {
  id: number;
  name: string;
  city: string;
  specialization: string;
  description: string;
  rating: number;
  completedCount: number;
  badge: string;
  inpostLockerId: string;
  address: string;
}

export type OrderStatus =
  | 'NEW' // Newly created, waiting for diagnosis payment
  | 'AWAITING_SHIPMENT' // Diagnosis paid, waiting for dropoff by client using InPost code
  | 'IN_TRANSIT_TO_SERVICE' // Client dropped package into Locker, in transit
  | 'IN_DIAGNOSIS' // Technician received the device, performing inspection
  | 'AWAITING_COST_APPROVAL' // Cost estimate proposed, client is reviewing to pay repair cost to escrow
  | 'IN_REPAIR' // Cost approved & paid to escrow, technician is working on the device
  | 'TESTING_AND_REPORTING' // Repair finished, technician uploading proofs / final report PDF
  | 'RETURN_IN_TRANSIT' // Package sent back, in transit with return Locker
  | 'DELIVERED_AWAITING_CONFIRMATION' // Reached customer's Locker, customer should test and release funds
  | 'COMPLETED' // Funds released, order finalized
  | 'DISPUTED'; // Dispute opened by customer

export type EscrowStatus =
  | 'NONE'
  | 'FROZEN_DIAGNOSIS' // Paid 40 PLN for shipping/diag
  | 'FROZEN_REPAIR' // Paid full repair estimate
  | 'RELEASED' // Released to the service provider
  | 'REFUNDED' // Returned to the client
  | 'DISPUTED'; // Frozen under admin conflict resolution

export interface RepairOrder {
  id: number;
  clientName: string;
  clientEmail: string;
  deviceName: string;
  category: 'Smartfony' | 'Laptopy' | 'Konsole' | 'Inne';
  description: string;
  status: OrderStatus;
  serviceProviderId: number;
  imageBeforeUrl: string | null;
  imageAfterUrl: string | null;
  diagnosisFee: number; // 40 PLN
  repairCost: number | null; // proposed cost e.g., 250 PLN
  trackingCodeInbound: string | null;
  trackingCodeOutbound: string | null;
  startLocker: string | null;
  targetLocker: string | null;
  escrowStatus: EscrowStatus;
  escrowAmount: number; // total amount frozen
  labelPdfUrl: string | null;
  reportPdfUrl: string | null;
  repairSummary: string | null;
  clientRating: number | null;
  clientReview: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  orderId: number;
  sender: 'CLIENT' | 'SERVICE' | 'SYSTEM';
  text: string;
  timestamp: string;
  isRead: boolean;
}

export interface SystemLog {
  id: string;
  timestamp: string;
  action: string;
  category: 'ESCROW' | 'LOGISTICS' | 'COMMUNICATION' | 'ORDER';
  details: string;
  orderId?: number;
}
