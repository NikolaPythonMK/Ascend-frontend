import { RoundingStrategy } from "../../enums/rounding-strategy.enum";
import { ServiceChargeTaxBehavior } from "../../enums/service-charge-tax-behavior.enum";
import { TaxCalculationMode } from "../../enums/tax-calculation-mode.enum";
import { TaxSourcingMode } from "../../enums/tax-sourcing-mode.enum";

export interface TaxCompliance {
  organizationId: number;
  calculationMode: TaxCalculationMode;
  sourcingMode: TaxSourcingMode;
  allowMultiComponentTaxes: boolean;
  enableCashRounding: boolean;
  cashRoundingIncrement: number;
  roundingStrategy: RoundingStrategy;
  serviceChargeBehavior: ServiceChargeTaxBehavior;
  enableEcoFee: boolean;
  ecoFeeAmount: number;
  enableMarginScheme: boolean;
  smallSupplierThreshold: number;
  enableRateScheduling: boolean;
}