export interface SalesTrendPointDto {
  date: string;
  total: number;
  salesCount: number;
}

export interface DashboardResponseDto {
  salesToday: number;
  salesCurrentMonth: number;
  salesCountToday: number;
  averageTicketToday: number;
  unitsSoldToday: number;
  salesTrend: SalesTrendPointDto[];
}

export interface TopProductDto {
  productId: string;
  reference: string;
  size: string;
  unitsSold: number;
  totalSold: number;
}

export interface SalesByUserDto {
  userId: string;
  username: string;
  firstName: string;
  lastName: string;
  totalSold: number;
  salesCount: number;
  averageTicket: number;
}

export interface TopClientDto {
  clientId: string;
  documentNumber: string;
  firstName: string;
  lastName: string;
  totalSpent: number;
  purchasesCount: number;
}
