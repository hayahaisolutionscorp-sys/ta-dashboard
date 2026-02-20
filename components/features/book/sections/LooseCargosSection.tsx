"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { IconTrash, IconPackage } from "@tabler/icons-react";

interface LooseCargo {
  description: string;
  weight?: number;
  volume?: number;
  packageType?: string;
  quantity: number;
  cargoClassCode?: string;
  tripAssignments: Array<{ tripId: string }>;
}

interface LooseCargosSectionProps {
  cargos: LooseCargo[];
  cargoClasses: string[];
  onRemove: (index: number) => void;
  onUpdate: (index: number, field: string, value: unknown) => void;
}

export default function LooseCargosSection({
  cargos,
  cargoClasses,
  onRemove,
  onUpdate,
}: LooseCargosSectionProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <IconPackage className="h-4 w-4 text-amber-600" />
        <h3 className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          Loose Cargo ({cargos.length})
        </h3>
      </div>

      <div className="space-y-3">
        {cargos.map((cargo, index) => (
          <div
            key={`cargo-${index}`}
            className="bg-white rounded-lg p-3 border border-amber-200 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-amber-700">
                Cargo {index + 1}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
                onClick={() => onRemove(index)}
              >
                <IconTrash className="h-3.5 w-3.5" />
              </Button>
            </div>

            {/* Description */}
            <Input
              placeholder="Cargo description"
              className="h-7 text-xs"
              value={cargo.description}
              onChange={(e) => onUpdate(index, "description", e.target.value)}
            />

            {/* Quantity, Weight, Class */}
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label
                  htmlFor={`cargo-qty-${index}`}
                  className="text-[10px] text-gray-500"
                >
                  Qty
                </label>
                <Input
                  id={`cargo-qty-${index}`}
                  type="number"
                  min={1}
                  className="h-7 text-xs"
                  value={cargo.quantity}
                  onChange={(e) =>
                    onUpdate(index, "quantity", Number(e.target.value))
                  }
                />
              </div>
              <div>
                <label
                  htmlFor={`cargo-weight-${index}`}
                  className="text-[10px] text-gray-500"
                >
                  Weight (kg)
                </label>
                <Input
                  id={`cargo-weight-${index}`}
                  type="number"
                  min={0}
                  step={0.1}
                  className="h-7 text-xs"
                  value={cargo.weight ?? ""}
                  onChange={(e) =>
                    onUpdate(index, "weight", Number(e.target.value))
                  }
                />
              </div>

              {cargoClasses.length > 0 ? (
                <div>
                  <label className="text-[10px] text-gray-500">Class</label>
                  <Select
                    value={cargo.cargoClassCode ?? ""}
                    onValueChange={(val) =>
                      onUpdate(index, "cargoClassCode", val)
                    }
                  >
                    <SelectTrigger className="h-7 text-xs">
                      <SelectValue placeholder="Class" />
                    </SelectTrigger>
                    <SelectContent>
                      {cargoClasses.map((cls) => (
                        <SelectItem key={cls} value={cls}>
                          {cls}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <label
                    htmlFor={`cargo-class-${index}`}
                    className="text-[10px] text-gray-500"
                  >
                    Class
                  </label>
                  <Input
                    id={`cargo-class-${index}`}
                    placeholder="Class code"
                    className="h-7 text-xs"
                    value={cargo.cargoClassCode ?? ""}
                    onChange={(e) =>
                      onUpdate(index, "cargoClassCode", e.target.value)
                    }
                  />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
